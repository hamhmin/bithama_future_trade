import { Router } from "express";
import prisma from "../prisma.js";
import { latestPrice } from "../websocket.js";

const router = Router();
const INITIAL_BALANCE = 100000;

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

router.get("/", async (_req, res) => {
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
        },
      },
      orders: {
        select: { id: true, status: true },
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
      const unrealizedPnl = openPositions.reduce(
        (sum, position) => sum + calcOpenPnl(position),
        0,
      );
      const realizedPnl = closedPositions.reduce(
        (sum, position) => sum + position.pnl,
        0,
      );
      const totalBalance = (user.wallet?.balance ?? 0) + (user.wallet?.locked ?? 0);
      const totalEquity = totalBalance + unrealizedPnl;
      const filledOrders = user.orders.filter((order) => order.status === "filled");
      const wins = closedPositions.filter((position) => position.pnl > 0).length;

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
        profitRate: ((totalEquity - INITIAL_BALANCE) / INITIAL_BALANCE) * 100,
        openPositionCount: openPositions.length,
        closedPositionCount: closedPositions.length,
        filledOrderCount: filledOrders.length,
        winRate:
          closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
        joinedAt: user.createdAt,
      };
    })
    .sort((a, b) => b.totalEquity - a.totalEquity)
    .map((row, index) => ({ rank: index + 1, ...row }));

  res.json({ latestPrice, rankings: rows });
});

export default router;
