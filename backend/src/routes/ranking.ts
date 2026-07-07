import { Router } from "express";
import prisma from "../prisma.js";
import { latestPrice } from "../websocket.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();
const INITIAL_BALANCE = 100000;
type RankingPeriod = "today" | "week" | "month" | "all";

function calcOpenPnl(position: {
  side: string;
  entryPrice: number;
  size: number;
}) {
  if (!latestPrice) return 0;
  return position.side === "long"
    ? (latestPrice - position.entryPrice) * position.size
    : (position.entryPrice - latestPrice) * position.size;
}

function getPeriodStart(period: RankingPeriod) {
  const now = new Date();
  if (period === "all") return null;

  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return start;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getPeriod(value: unknown): RankingPeriod {
  return value === "today" || value === "week" || value === "month"
    ? value
    : "all";
}

async function buildRankings(period: RankingPeriod) {
  const periodStart = getPeriodStart(period);
  const users = await prisma.user.findMany({
    include: {
      wallet: true,
      positions: {
        select: {
          id: true,
          side: true,
          entryPrice: true,
          size: true,
          status: true,
          pnl: true,
          margin: true,
          updatedAt: true,
        },
      },
      orders: {
        select: { id: true, status: true, updatedAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = users
    .filter((user) => user.wallet)
    .map((user) => {
      const openPositions = user.positions.filter((p) => p.status === "open");
      const closedPositions = user.positions.filter(
        (p) => p.status === "closed" || p.status === "liquidated",
      );
      const periodClosedPositions = periodStart
        ? closedPositions.filter((position) => position.updatedAt >= periodStart)
        : closedPositions;
      const unrealizedPnl = openPositions.reduce(
        (sum, position) => sum + calcOpenPnl(position),
        0,
      );
      const realizedPnl = closedPositions.reduce(
        (sum, position) => sum + position.pnl,
        0,
      );
      const periodPnl = periodClosedPositions.reduce(
        (sum, position) => sum + position.pnl,
        0,
      );
      const totalBalance = (user.wallet?.balance ?? 0) + (user.wallet?.locked ?? 0);
      const totalEquity = totalBalance + unrealizedPnl;
      const filledOrders = user.orders.filter((order) => order.status === "filled");
      const periodFilledOrders = periodStart
        ? filledOrders.filter((order) => order.updatedAt >= periodStart)
        : filledOrders;
      const wins = closedPositions.filter((position) => position.pnl > 0).length;
      const periodWins = periodClosedPositions.filter(
        (position) => position.pnl > 0,
      ).length;
      const score = period === "all" ? totalEquity : periodPnl + unrealizedPnl;

      return {
        userId: user.id,
        nickname: user.nickname,
        isGuest: user.email.startsWith("guest_"),
        totalEquity,
        totalBalance,
        availableBalance: user.wallet?.balance ?? 0,
        lockedMargin: user.wallet?.locked ?? 0,
        unrealizedPnl,
        realizedPnl,
        periodPnl,
        rankScore: score,
        profitRate: ((totalEquity - INITIAL_BALANCE) / INITIAL_BALANCE) * 100,
        periodProfitRate: (score / INITIAL_BALANCE) * 100,
        openPositionCount: openPositions.length,
        closedPositionCount: closedPositions.length,
        filledOrderCount:
          period === "all" ? filledOrders.length : periodFilledOrders.length,
        winRate:
          periodClosedPositions.length > 0
            ? (periodWins / periodClosedPositions.length) * 100
            : period === "all" && closedPositions.length > 0
              ? (wins / closedPositions.length) * 100
              : 0,
        joinedAt: user.createdAt,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .map((row, index) => ({ rank: index + 1, ...row }));

  return rows;
}

router.get("/", async (req, res) => {
  const period = getPeriod(req.query.period);
  const rows = await buildRankings(period);

  res.json({ latestPrice, period, rankings: rows });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const period = getPeriod(req.query.period);
  const rows = await buildRankings(period);
  const me = rows.find((row) => row.userId === req.userId);

  if (!me) {
    res.status(404).json({ message: "랭킹을 찾을 수 없어요." });
    return;
  }

  res.json({ latestPrice, period, ranking: me, totalUsers: rows.length });
});

export default router;
