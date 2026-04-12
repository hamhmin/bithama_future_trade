import { Router } from "express";
import type { Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// 유지마진율 0.5%
const MAINTENANCE_MARGIN_RATE = 0.005;

// 청산가 계산
function calcLiquidationPrice(
  side: string,
  entryPrice: number,
  leverage: number
): number {
  if (side === "long") {
    return entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE);
  } else {
    return entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
  }
}

// 주문 API
router.post("/order", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { side, type, price, size, leverage = 10 } = req.body;

  // 입력값 검증
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
  if (type === "limit" && !price) {
    res.status(400).json({ message: "지정가 주문엔 price가 필요해요." });
    return;
  }

  // 지갑 확인
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    res.status(400).json({ message: "지갑이 없어요." });
    return;
  }

  // 현재가 가져오기
  let executionPrice = price;
  if (type === "market") {
    const latest = await prisma.candle.findFirst({
      where: { symbol: "BTCUSDT", interval: "1m" },
      orderBy: { openTime: "desc" },
    });
    if (!latest) {
      res.status(500).json({ message: "현재가를 가져올 수 없어요." });
      return;
    }
    executionPrice = latest.close;
  }

  // 증거금 계산
  const margin = (executionPrice * size) / leverage;

  // 잔고 확인
  if (wallet.balance < margin) {
    res.status(400).json({ message: "잔고가 부족해요." });
    return;
  }

  // 청산가 계산
  const liquidationPrice = calcLiquidationPrice(side, executionPrice, leverage);

  try {
    if (type === "market") {
      const result = await prisma.$transaction(async (tx) => {
        // 잔고 차감
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: margin },
            locked: { increment: margin },
          },
        });

        // 기존 같은 방향 오픈 포지션 찾기
        const existing = await tx.position.findFirst({
          where: { userId, side, status: "open", symbol: "BTCUSDT" },
        });

        let position;

        if (existing) {
          // 기존 포지션 합산
          const newSize = existing.size + size;
          const newMargin = existing.margin + margin;

          // 평균 진입가 계산
          const newEntryPrice =
            (existing.entryPrice * existing.size + executionPrice * size) /
            newSize;

          // 새 평균 진입가 기준으로 청산가 재계산
          const newLiquidationPrice = calcLiquidationPrice(
            side,
            newEntryPrice,
            leverage
          );

          position = await tx.position.update({
            where: { id: existing.id },
            data: {
              size: newSize,
              margin: newMargin,
              entryPrice: newEntryPrice,
              liquidationPrice: newLiquidationPrice,
            },
          });
        } else {
          // 새 포지션 생성
          position = await tx.position.create({
            data: {
              userId,
              side,
              size,
              entryPrice: executionPrice,
              leverage,
              margin,
              liquidationPrice,
            },
          });
        }

        // 주문 기록
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
          },
        });

        return { position, order };
      });

      res.json({ message: "시장가 주문 체결!", ...result });
    } else {
      // 지정가는 기존과 동일 (체결 전이라 합산 불필요)
      const result = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: margin },
            locked: { increment: margin },
          },
        });

        const order = await tx.order.create({
          data: {
            userId,
            side,
            type,
            price: executionPrice,
            size,
            leverage,
            margin,
            status: "open",
          },
        });

        return { order };
      });

      res.json({ message: "지정가 주문 등록!", ...result });
    }
  } catch (err) {
    console.error("주문 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 내 포지션 조회
router.get("/positions", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const positions = await prisma.position.findMany({
    where: { userId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  res.json(positions);
});

// 내 주문 조회
router.get("/orders", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const orders = await prisma.order.findMany({
    where: { userId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// 주문 취소
router.delete("/order/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const orderId = parseInt(req.params.id);

  const order = await prisma.order.findUnique({ where: { id: orderId } });

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
});
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const orders = await prisma.order.findMany({
    where: { userId, status: "filled" },
    orderBy: { createdAt: "desc" },
    take: 50, // 최근 50개만
  });
  res.json(orders);
});
// 포지션 청산
router.post("/position/:id/close", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const positionId = parseInt(req.params.id);

  // 포지션 확인
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

  // 현재가 가져오기
  const latest = await prisma.candle.findFirst({
    where: { symbol: "BTCUSDT", interval: "1m" },
    orderBy: { openTime: "desc" },
  });
  if (!latest) {
    res.status(500).json({ message: "현재가를 가져올 수 없어요." });
    return;
  }

  const currentPrice = latest.close;

  // 손익 계산
  let pnl = 0;
  if (position.side === "long") {
    pnl = (currentPrice - position.entryPrice) * position.size;
  } else {
    pnl = (position.entryPrice - currentPrice) * position.size;
  }

  // 반환금액 = 증거금 + 손익
  const returnAmount = position.margin + pnl;

  try {
    await prisma.$transaction(async (tx) => {
      // 포지션 상태 업데이트
      await tx.position.update({
        where: { id: positionId },
        data: {
          status: "closed",
          pnl,
        },
      });

      // 청산 주문 기록
      await tx.order.create({
        data: {
          userId,
          positionId,
          side: position.side,
          type: "market",
          size: position.size,
          leverage: position.leverage,
          margin: position.margin,
          status: "filled",
          price: currentPrice,
        },
      });

      // 지갑 정산
      // locked 해제 + 손익 반영
      await tx.wallet.update({
        where: { userId },
        data: {
          // 반환금액이 0보다 작으면 (손실이 증거금보다 크면) 0으로 처리
          balance: { increment: Math.max(returnAmount, 0) },
          locked: { decrement: position.margin },
        },
      });
    });

    res.json({
      message: "포지션 청산 완료!",
      pnl: pnl.toFixed(2),
      returnAmount: Math.max(returnAmount, 0).toFixed(2),
      currentPrice,
    });
  } catch (err) {
    console.error("청산 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
export default router;