import WebSocket, { WebSocketServer } from "ws";
import prisma from "./prisma.js";

interface TradeData {
  type: string;
  price: string;
  quantity: string;
  time: number;
}

interface DepthData {
  type: string;
  bids: string[];
  asks: string[];
}

// 청산가 계산
const MAINTENANCE_MARGIN_RATE = 0.005;
const calcLiquidationPrice = (
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

// 자동 청산 체크
const checkLiquidation = async (currentPrice: number) => {
  try {
    const positions = await prisma.position.findMany({
      where: {
        status: "open",
        OR: [
          {
            side: "long",
            liquidationPrice: { gte: currentPrice },
          },
          {
            side: "short",
            liquidationPrice: { lte: currentPrice },
          },
        ],
      },
    });

    if (positions.length === 0) return;

    for (const position of positions) {
      await prisma.$transaction(async (tx) => {
        await tx.position.update({
          where: { id: position.id },
          data: {
            status: "liquidated",
            pnl: -position.margin,
          },
        });

        await tx.order.create({
          data: {
            userId: position.userId,
            positionId: position.id,
            side: position.side,
            type: "market",
            size: position.size,
            leverage: position.leverage,
            margin: position.margin,
            status: "filled",
            price: currentPrice,
          },
        });

        // locked 해제, balance는 증가 없음 (증거금 전액 손실)
        await tx.wallet.update({
          where: { userId: position.userId },
          data: {
            locked: { decrement: position.margin },
          },
        });
      });

      console.log(`포지션 ${position.id} 강제청산! 현재가: ${currentPrice}`);
    }
  } catch (err) {
    console.error("청산 체크 오류:", err);
  }
};

// 지정가 자동 체결 체크
const checkLimitOrders = async (currentPrice: number) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "open",
        type: "limit",
        OR: [
          {
            side: "long",
            price: { gte: currentPrice },
          },
          {
            side: "short",
            price: { lte: currentPrice },
          },
        ],
      },
    });

    if (orders.length === 0) return;

    for (const order of orders) {
      await prisma.$transaction(async (tx) => {
        const liquidationPrice = calcLiquidationPrice(
          order.side,
          order.price!,
          order.leverage,
        );

        // 기존 같은 방향 포지션 찾기
        const existing = await tx.position.findFirst({
          where: {
            userId: order.userId,
            side: order.side,
            status: "open",
            symbol: "BTCUSDT",
          },
        });

        if (existing) {
          // 기존 포지션 합산
          const newSize = existing.size + order.size;
          const newMargin = existing.margin + order.margin;
          const newEntryPrice =
            (existing.entryPrice * existing.size + order.price! * order.size) /
            newSize;
          const newLiquidationPrice = calcLiquidationPrice(
            order.side,
            newEntryPrice,
            order.leverage,
          );

          await tx.position.update({
            where: { id: existing.id },
            data: {
              size: newSize,
              margin: newMargin,
              entryPrice: newEntryPrice,
              liquidationPrice: newLiquidationPrice,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "filled",
              positionId: existing.id,
            },
          });
        } else {
          // 새 포지션 생성
          const position = await tx.position.create({
            data: {
              userId: order.userId,
              side: order.side,
              size: order.size,
              entryPrice: order.price!,
              leverage: order.leverage,
              margin: order.margin,
              liquidationPrice,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "filled",
              positionId: position.id,
            },
          });
        }
      });

      console.log(`지정가 주문 ${order.id} 체결! 현재가: ${currentPrice}`);
    }
  } catch (err) {
    console.error("지정가 체결 오류:", err);
  }
};

// 바이낸스 체결가 호출 ws
export const connectBinanceQuote = (wss: WebSocketServer) => {
  // 기존 현물(Spot): wss://stream.binance.com/ws/btcusdt@trade
  // trade->aggTrade : 같은시간 같은 가격 거래 한번에 묶어서 보내줌
  // 변경 선물(USD-M Futures):
  const ws = new WebSocket("wss://fstream.binance.com/ws/btcusdt@aggTrade");
  let latestTrade: TradeData | null = null;
  let lastSentTrade: TradeData | null = null;

  ws.on("open", () => {
    console.log("바이낸스 체결가 WebSocket 연결됐어요!");
  });

  ws.on("message", (data) => {
    const trade = JSON.parse(data.toString());
    latestTrade = {
      type: "체결가",
      price: trade.p,
      quantity: trade.q,
      time: trade.T,
    };
  });

  ws.on("close", () => {
    console.log("연결 끊겼어요. 재연결 시도...");
    setTimeout(() => connectBinanceQuote(wss), 3000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket 오류:", err);
  });

  // 100ms마다 브로드캐스트 + 청산/지정가 체크
  setInterval(async () => {
    if (!latestTrade) return;

    if (
      lastSentTrade &&
      lastSentTrade.price === latestTrade.price &&
      lastSentTrade.quantity === latestTrade.quantity &&
      lastSentTrade.time === latestTrade.time
    ) {
      return;
    }

    lastSentTrade = latestTrade;
    const currentPrice = parseFloat(latestTrade.price);

    // 프론트 브로드캐스트
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(latestTrade));
      }
    });

    // 자동 청산 + 지정가 체결 체크
    await checkLiquidation(currentPrice);
    await checkLimitOrders(currentPrice);
  }, 100);
};

// 바이낸스 호가창 호출 ws (기존 코드 그대로)
export const connectBinanceCall = (wss: WebSocketServer) => {
  const ws = new WebSocket(`wss://stream.binance.com/ws/btcusdt@depth10`);

  ws.on("open", () => {
    console.log("바이낸스 호가창 WebSocket 연결됐어요!");
  });

  let latestTrade: DepthData | null = null;
  let lastSentString: string = "";

  ws.on("message", (data) => {
    const trade = JSON.parse(data.toString());

    // 데이터 변환 함수: 소수점 제한 및 키 부여
    const formatOrders = (orders: any) => {
      if (!orders) return [];
      return orders.map((order: any) => ({
        price: parseFloat(order[0]).toFixed(2), // 가격 소수점 2자리 (예: 68402.80)
        quantity: parseFloat(order[1]).toFixed(5), // 수량 소수점 5자리 (예: 1.17302)
      }));
    };

    latestTrade = {
      type: "호가창",
      bids: formatOrders(trade.bids),
      asks: formatOrders(trade.asks),
    };

    const currentString = JSON.stringify(latestTrade);

    if (currentString === lastSentString) return;
    lastSentString = currentString;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(currentString);
      }
    });
  });

  ws.on("close", () => {
    console.log("연결 끊겼어요. 재연결 시도...");
    setTimeout(() => connectBinanceCall(wss), 3000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket 오류:", err);
  });
};
