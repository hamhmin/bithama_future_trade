import { Router } from "express";
import type { Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { latestPrice } from "../websocket.js";
import { sendToUser } from "../websocket.js";
import { latestDepth, latestTradeData } from "../websocket.js";
import rateLimit from "express-rate-limit";

const router = Router();

// 유지마진율 0.5%
const MAINTENANCE_MARGIN_RATE = 0.005;

const MAKER_FEE_RATE = 0.0002;
const TAKER_FEE_RATE = 0.0005;
// Isolated 청산가
const calcIsolatedLiqPrice = (
  side: string,
  entryPrice: number,
  leverage: number,
): number => {
  if (side === "long") {
    return entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE);
  } else {
    return entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
  }
};

// Cross 청산가
// 지갑 전체 잔고(balance + locked)가 버퍼
const calcCrossLiqPrice = (
  side: string,
  entryPrice: number,
  size: number,
  walletTotal: number, // balance + locked 전체
): number => {
  if (side === "long") {
    return entryPrice - (walletTotal * (1 - MAINTENANCE_MARGIN_RATE)) / size;
  } else {
    return entryPrice + (walletTotal * (1 - MAINTENANCE_MARGIN_RATE)) / size;
  }
};

// 청산가 계산
function calcLiquidationPrice(
  side: string,
  entryPrice: number,
  leverage: number,
): number {
  if (side === "long") {
    return entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE);
  } else {
    return entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
  }
}

const orderLimiter = rateLimit({
  windowMs: 1000, // 1초에 1번
  max: 1,
  message: { message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
});
// 주문 API
router.post(
  "/order",
  orderLimiter,
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const {
      side,
      type,
      price,
      size,
      leverage = 10,
      takeProfit,
      stopLoss,
    } = req.body;

    // 유저 마진타입 설정 가져오기
    const setting = await prisma.userSymbolSetting.findUnique({
      where: { userId_symbol: { userId, symbol: "BTCUSDT" } },
    });
    const marginType = setting?.marginType ?? "isolated";

    if (!side || !type || !size || !leverage) {
      res.status(400).json({ message: "필수 값이 빠졌어요." });
      return;
    }
    if (!["long", "short"].includes(side)) {
      res.status(400).json({ message: "side는 long 또는 short이어야 해요." });
      return;
    }
    if (!["market", "limit"].includes(type)) {
      res.status(400).json({ message: "type은 market 또는 limit이어야 해요." });
      return;
    }
    if (!["isolated", "cross"].includes(marginType)) {
      res
        .status(400)
        .json({ message: "marginType은 isolated 또는 cross이어야 해요." });
      return;
    }
    if (type === "limit" && !price) {
      res.status(400).json({ message: "지정가 주문엔 price가 필요해요." });
      return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(400).json({ message: "지갑이 없어요." });
      return;
    }

    // 현재가 가져오기
    let executionPrice = price;
    if (type === "market") {
      if (!latestPrice) {
        res.status(500).json({ message: "현재가를 가져올 수 없어요." });
        return;
      }
      executionPrice = latestPrice;
    }

    // 증거금 계산
    const margin = (executionPrice * size) / leverage;
    const fee = parseFloat((executionPrice * size * TAKER_FEE_RATE).toFixed(8));
    const totalRequired = margin + fee;

    // 잔고 확인 (둘 다 증거금만큼 필요)
    if (wallet.balance < totalRequired) {
      res.status(400).json({ message: "잔고가 부족해요. (수수료 포함)" });
      return;
    }

    // 청산가 계산
    const walletTotal = wallet.balance + wallet.locked;
    const liquidationPrice =
      marginType === "isolated"
        ? calcIsolatedLiqPrice(side, executionPrice, leverage)
        : calcCrossLiqPrice(side, executionPrice, size, walletTotal);
    console.log("청산가 계산:", {
      side,
      executionPrice,
      leverage,
      margin,
      liquidationPrice,
    });
    try {
      if (type === "market") {
        const result = await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId },
            data: {
              balance: { decrement: margin },
              locked: { increment: margin },
            },
          });

          // 기존 같은 방향 + 같은 마진타입 포지션 찾기
          const existing = await tx.position.findFirst({
            where: {
              userId,
              side,
              status: "open",
              symbol: "BTCUSDT",
              marginType, // 마진타입도 같아야 합산
            },
          });

          let position;

          if (existing) {
            const newSize = parseFloat((existing.size + size).toFixed(8));
            const newMargin = parseFloat((existing.margin + margin).toFixed(8));
            const newEntryPrice = parseFloat(
              (
                (existing.entryPrice * existing.size + executionPrice * size) /
                newSize
              ).toFixed(2),
            );

            // Cross면 업데이트된 지갑 잔고로 청산가 재계산
            const updatedWallet = await tx.wallet.findUnique({
              where: { userId },
            });
            const newWalletTotal =
              updatedWallet!.balance + updatedWallet!.locked;

            const newLiquidationPrice = parseFloat(
              (marginType === "isolated"
                ? calcIsolatedLiqPrice(side, newEntryPrice, leverage)
                : calcCrossLiqPrice(
                    side,
                    newEntryPrice,
                    newSize,
                    newWalletTotal,
                  )
              ).toFixed(2),
            );

            console.log("합산 계산:", {
              existing: {
                entryPrice: existing.entryPrice,
                size: existing.size,
              },
              new: { executionPrice, size },
              newEntryPrice,
              newSize,
            });

            position = await tx.position.update({
              where: { id: existing.id },
              data: {
                size: newSize,
                margin: newMargin,
                entryPrice: newEntryPrice,
                liquidationPrice: newLiquidationPrice,
                leverage, // (마지막 진입 레버리지로 업데이트)
              },
            });
          } else {
            position = await tx.position.create({
              data: {
                userId,
                side,
                size,
                entryPrice: executionPrice,
                leverage,
                margin,
                liquidationPrice,
                marginType, // 저장
                takeProfit: takeProfit ?? null,
                stopLoss: stopLoss ?? null,
              },
            });
          }

          const fee = parseFloat(
            (executionPrice * size * TAKER_FEE_RATE).toFixed(8),
          );

          const order = await tx.order.create({
            data: {
              userId,
              positionId: position.id,
              side,
              type,
              size,
              leverage,
              margin,
              status: "filled",
              price: executionPrice,
              fee,
              feeType: "taker",
              orderRole: "open",
            },
          });

          await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: fee } },
          });

          return { position, order };
        });
        sendToUser(userId, {
          type: "filled",
          message: "시장가 주문이 체결됐어요!",
        });
        res.json({ message: "시장가 주문 체결!", ...result });
      } else {
        // 지정가
        const result = await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId },
            data: {
              balance: { decrement: margin },
              locked: { increment: margin },
            },
          });
          // 지정가 분기 안에서 order.create 바로 위에 추가
          const isTaker =
            (side === "long" && executionPrice >= latestPrice!) ||
            (side === "short" && executionPrice <= latestPrice!);

          const order = await tx.order.create({
            data: {
              userId,
              side,
              type,
              price: executionPrice,
              size,
              leverage,
              margin,
              marginType, // 저장
              status: "open",
              feeType: isTaker ? "taker" : "maker", // 수수료 타입
              orderRole: "open",
            },
          });

          return { order };
        });

        sendToUser(userId, {
          type: "ordered",
          message: "지정가 주문 등록됐어요!",
        });

        res.json({ message: "지정가 주문 등록!", ...result });
      }
    } catch (err) {
      console.error("주문 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
  },
);

// 내 포지션 조회
router.get(
  "/positions",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const positions = await prisma.position.findMany({
      where: { userId, status: "open" },
      orderBy: { createdAt: "desc" },
    });
    res.json(positions);
  },
);

// 내 주문 조회
router.get(
  "/orders",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const orders = await prisma.order.findMany({
      where: { userId, status: "open" },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  },
);

// 주문 취소
router.delete(
  "/order/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const orderId = parseInt(req.params.id as string);

    const order = await prisma.order.findFirst({
      where: { id: parseInt(req.params.id as string), userId },
    });
    if (!order) {
      res.status(403).json({ message: "권한이 없어요." });
      return;
    }
    if (!order || order.userId !== userId) {
      res.status(404).json({ message: "주문을 찾을 수 없어요." });
      return;
    }
    if (order.status !== "open") {
      res.status(400).json({ message: "취소할 수 없는 주문이에요." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // locked 해제, balance 복구
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: order.margin },
          locked: { decrement: order.margin },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
      });
    });

    res.json({ message: "주문 취소 완료!" });
  },
);
router.get(
  "/history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const orders = await prisma.order.findMany({
      where: { userId, status: "filled" },
      orderBy: { createdAt: "desc" },
      take: 50, // 최근 50개만
    });
    res.json(orders);
  },
);
// 포지션 청산
router.post(
  "/position/:id/close",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const positionId = parseInt(req.params.id as string);

    const { size, type = "market", price } = req.body; // size 추가

    const position = await prisma.position.findFirst({
      where: { id: positionId, userId }, // userId 추가
    });
    if (!position) {
      res.status(403).json({ message: "권한이 없어요." });
      return;
    }
    if (!position || position.userId !== userId) {
      res.status(404).json({ message: "포지션을 찾을 수 없어요." });
      return;
    }
    if (position.status !== "open") {
      res.status(400).json({ message: "이미 청산된 포지션이에요." });
      return;
    }

    // size 없으면 전체 청산
    const closeSize = size ?? position.size;

    if (closeSize <= 0 || closeSize > position.size) {
      res.status(400).json({ message: "올바른 수량을 입력해주세요." });
      return;
    }

    const currentPrice = type === "market" ? latestPrice : price;
    if (!currentPrice) {
      res.status(500).json({ message: "현재가를 가져올 수 없어요." });
      return;
    }

    const isFullClose = closeSize === position.size;
    const ratio = closeSize / position.size;
    const closingMargin = position.margin * ratio;

    const pnl =
      position.side === "long"
        ? (currentPrice - position.entryPrice) * closeSize
        : (position.entryPrice - currentPrice) * closeSize;

    const fee = parseFloat(
      (currentPrice * closeSize * TAKER_FEE_RATE).toFixed(8),
    );
    const returnAmount = Math.max(closingMargin + pnl - fee, 0);

    try {
      await prisma.$transaction(async (tx) => {
        if (isFullClose) {
          // 전체 청산
          await tx.position.update({
            where: { id: positionId },
            data: { status: "closed", pnl },
          });
        } else {
          // 부분 청산
          await tx.position.update({
            where: { id: positionId },
            data: {
              size: parseFloat((position.size - closeSize).toFixed(8)),
              margin: parseFloat((position.margin - closingMargin).toFixed(8)),
            },
          });
        }

        await tx.order.create({
          data: {
            userId,
            positionId,
            side: position.side,
            type: "market",
            size: closeSize,
            leverage: position.leverage,
            margin: closingMargin,
            status: "filled",
            price: currentPrice,
            fee,
            feeType: "taker",
            orderRole: "close",
          },
        });

        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { increment: returnAmount },
            locked: { decrement: closingMargin },
          },
        });
      });

      sendToUser(userId, { type: "filled", message: "청산 완료!" });

      res.json({
        message: isFullClose ? "전체 청산 완료!" : "부분 청산 완료!",
        pnl: pnl.toFixed(2),
        returnAmount: returnAmount.toFixed(2),
      });
    } catch (err) {
      console.error("청산 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
  },
);

// 증거금 추가 API
router.post(
  "/position/:id/add-margin",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const positionId = parseInt(req.params.id as string);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: "추가할 증거금을 입력해주세요." });
      return;
    }

    const [position, wallet] = await Promise.all([
      prisma.position.findFirst({ where: { id: positionId, userId } }),
      prisma.wallet.findUnique({ where: { userId } }),
    ]);

    if (!position) {
      res.status(403).json({ message: "권한이 없어요." });
      return;
    }

    if (!position || position.userId !== userId) {
      res.status(404).json({ message: "포지션을 찾을 수 없어요." });
      return;
    }
    if (position.status !== "open") {
      res.status(400).json({ message: "이미 청산된 포지션이에요." });
      return;
    }
    if (!wallet || wallet.balance < amount) {
      res.status(400).json({ message: "잔고가 부족해요." });
      return;
    }

    // 새 증거금으로 청산가 재계산
    const newMargin = position.margin + amount;
    const effectiveLeverage = (position.entryPrice * position.size) / newMargin;
    const newLiquidationPrice =
      position.side === "long"
        ? position.entryPrice *
          (1 - 1 / effectiveLeverage + MAINTENANCE_MARGIN_RATE)
        : position.entryPrice *
          (1 + 1 / effectiveLeverage - MAINTENANCE_MARGIN_RATE);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.position.update({
          where: { id: positionId },
          data: {
            margin: newMargin,
            liquidationPrice: newLiquidationPrice,
          },
        });

        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: amount },
            locked: { increment: amount },
          },
        });
      });

      res.json({
        message: "증거금 추가 완료!",
        newMargin,
        newLiquidationPrice,
      });
    } catch (err) {
      console.error("증거금 추가 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
  },
);

// 레버리지 변경 API (상향만 가능)
router.post(
  "/position/:id/leverage",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const positionId = parseInt(req.params.id as string);
    const { leverage } = req.body;

    if (!leverage || leverage <= 0) {
      res.status(400).json({ message: "레버리지를 입력해주세요." });
      return;
    }

    const position = await prisma.position.findFirst({
      where: { id: parseInt(req.params.id as string), userId },
    });

    if (!position) {
      res.status(403).json({ message: "권한이 없어요." });
      return;
    }

    if (!position || position.userId !== userId) {
      res.status(404).json({ message: "포지션을 찾을 수 없어요." });
      return;
    }
    if (position.status !== "open") {
      res.status(400).json({ message: "이미 청산된 포지션이에요." });
      return;
    }

    // isol만 상향만 가능
    if (position.marginType === "isolated" && leverage <= position.leverage) {
      res.status(400).json({
        message: `Isolated는 현재 레버리지(${position.leverage}x)보다 높게만 설정 가능해요.`,
      });
      return;
    }

    // 새 레버리지로 청산가 재계산
    const newLiquidationPrice =
      position.side === "long"
        ? position.entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
        : position.entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);

    try {
      await prisma.$transaction(async (tx) => {
        // 새 레버리지 기준 증거금 계산
        const newMargin = (position.entryPrice * position.size) / leverage;
        const marginDiff = position.margin - newMargin; // 줄어든 증거금

        await tx.position.update({
          where: { id: positionId },
          data: {
            leverage,
            margin: newMargin,
            liquidationPrice: newLiquidationPrice,
          },
        });

        // 레버리지 올리면 증거금이 줄어드니까 차액을 balance로 환원
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { increment: marginDiff },
            locked: { decrement: marginDiff },
          },
        });
      });

      res.json({
        message: "레버리지 변경 완료!",
        leverage,
        newLiquidationPrice,
      });
    } catch (err) {
      console.error("레버리지 변경 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
  },
);
// 마진타입 조회
router.get(
  "/setting",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const setting = await prisma.userSymbolSetting.findUnique({
      where: { userId_symbol: { userId, symbol: "BTCUSDT" } },
    });

    res.json({
      marginType: setting?.marginType ?? "isolated", // 없으면 기본값 isolated
    });
  },
);

// 마진타입 변경
router.post(
  "/setting/margin-type",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { marginType } = req.body;

    if (!["isolated", "cross"].includes(marginType)) {
      res.status(400).json({ message: "잘못된 마진타입이에요." });
      return;
    }

    // 오픈 포지션 있으면 변경 불가
    const openPosition = await prisma.position.findFirst({
      where: { userId, status: "open", symbol: "BTCUSDT" },
    });

    if (openPosition) {
      res.status(400).json({
        message:
          "포지션 보유 중엔 마진타입을 변경할 수 없어요. 모든 포지션을 청산 후 변경해주세요.",
      });
      return;
    }

    // 설정 저장 (없으면 생성, 있으면 업데이트)
    await prisma.userSymbolSetting.upsert({
      where: { userId_symbol: { userId, symbol: "BTCUSDT" } },
      create: { userId, symbol: "BTCUSDT", marginType },
      update: { marginType },
    });

    res.json({ message: "마진타입 변경 완료!", marginType });
  },
);
// TP/SL 설정
router.post(
  "/position/:id/tpsl",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const positionId = parseInt(req.params.id as string);
    const { takeProfit, stopLoss } = req.body;

    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position || position.userId !== userId) {
      res.status(404).json({ message: "포지션을 찾을 수 없어요." });
      return;
    }
    if (position.status !== "open") {
      res.status(400).json({ message: "이미 청산된 포지션이에요." });
      return;
    }

    // 검증
    if (takeProfit) {
      if (position.side === "long" && takeProfit <= position.entryPrice) {
        res.status(400).json({ message: "Long TP는 진입가보다 높아야 해요." });
        return;
      }
      if (position.side === "short" && takeProfit >= position.entryPrice) {
        res.status(400).json({ message: "Short TP는 진입가보다 낮아야 해요." });
        return;
      }
    }

    if (stopLoss) {
      if (position.side === "long" && stopLoss >= position.entryPrice) {
        res.status(400).json({ message: "Long SL은 진입가보다 낮아야 해요." });
        return;
      }
      if (position.side === "short" && stopLoss <= position.entryPrice) {
        res.status(400).json({ message: "Short SL은 진입가보다 높아야 해요." });
        return;
      }
    }

    await prisma.position.update({
      where: { id: positionId },
      data: {
        takeProfit: takeProfit ?? null,
        stopLoss: stopLoss ?? null,
      },
    });

    res.json({ message: "TP/SL 설정 완료!" });
  },
);
// 자산 현황
router.get(
  "/assets",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const [wallet, positions] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.position.findMany({
        where: { userId, status: "open" },
      }),
    ]);

    if (!wallet) {
      res.status(404).json({ message: "지갑을 찾을 수 없어요." });
      return;
    }

    // 미실현 손익 계산을 위한 현재가
    const latest = await prisma.candle.findFirst({
      where: { symbol: "BTCUSDT", interval: "1m" },
      orderBy: { openTime: "desc" },
    });
    const currentPrice = latest?.close ?? 0;

    // 미실현 손익 합산
    const unrealizedPnl = positions.reduce((sum, pos) => {
      const pnl =
        pos.side === "long"
          ? (currentPrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - currentPrice) * pos.size;
      return sum + pnl;
    }, 0);

    const totalMargin = wallet.locked;
    const totalBalance = wallet.balance + wallet.locked;
    const totalEquity = totalBalance + unrealizedPnl;

    res.json({
      balance: wallet.balance, // 가용 잔고
      locked: wallet.locked, // 증거금
      totalBalance, // 총 잔고 (balance + locked)
      unrealizedPnl, // 미실현 손익
      totalEquity, // 총 자산 (총잔고 + 미실현손익)
      marginRatio:
        totalMargin > 0 // 증거금 비율
          ? (totalMargin / totalEquity) * 100
          : 0,
    });
  },
);
// 포지션 히스토리 (청산된 포지션)
router.get(
  "/positions/history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const positions = await prisma.position.findMany({
      where: {
        userId,
        // status 조건 제거 → 전체 포지션
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        orders: {
          where: { status: "filled" },
          select: { price: true, size: true, fee: true, orderRole: true },
        },
      },
    });

    // 종료 평균가 + 총 수수료 계산
    const result = positions.map((pos) => {
      // orderRole이 "close"인 주문만 종료 주문으로 판별
      const closeOrders = pos.orders.filter(
        (o) => o.price && o.size && o.orderRole === "close",
      );

      const totalCloseSize = closeOrders.reduce((sum, o) => sum + o.size, 0);
      const avgClosePrice =
        totalCloseSize > 0
          ? closeOrders.reduce((sum, o) => sum + o.price! * o.size, 0) /
            totalCloseSize
          : null;

      const totalFee = pos.orders.reduce((sum, o) => sum + (o.fee ?? 0), 0);

      return { ...pos, avgClosePrice, totalFee };
    });

    res.json(result);
  },
);

// 펀딩비 내역
router.get(
  "/funding/history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const history = await prisma.fundingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        position: {
          select: { side: true, symbol: true },
        },
      },
    });

    res.json(history);
  },
);
// 거래 통계
router.get(
  "/stats",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const positions = await prisma.position.findMany({
      where: {
        userId,
        status: { in: ["closed", "liquidated"] },
      },
    });

    const totalTrades = positions.length;
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const winTrades = positions.filter((p) => p.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    const bestTrade =
      totalTrades > 0 ? Math.max(...positions.map((p) => p.pnl)) : 0;

    // 매 거래 수익률 합산
    // 각 포지션의 수익률 = pnl / margin * 100
    const sumOfRoe = positions.reduce((sum, p) => {
      const roe = p.margin > 0 ? (p.pnl / p.margin) * 100 : 0;
      return sum + roe;
    }, 0);

    // 총 누적 수익률 = 총손익 / 총투입증거금 * 100
    const totalMargin = positions.reduce((sum, p) => sum + p.margin, 0);
    const cumulativeRoe = totalMargin > 0 ? (totalPnl / totalMargin) * 100 : 0;

    res.json({
      totalTrades,
      totalPnl,
      winRate,
      bestTrade,
      sumOfRoe, // 매 거래 수익률 합산
      cumulativeRoe, // 총 누적 수익률
    });
  },
);
router.get("/initial-data", async (req, res) => {
  res.json({
    depth: latestDepth,
    trade: latestTradeData,
  });
});
export default router;
