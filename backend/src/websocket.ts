import WebSocket, { WebSocketServer } from "ws";
import prisma from "./prisma.js";
import { transitionPosition, transitionOrder } from "./lib/stateMachine.js";

export let latestPrice: number = 0;
export let latestDepth: any = null; // 호가창
export let latestTradeData: any = null; // 체결가

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

// 유저별 소켓 Map
export const userSocketMap = new Map<number, WebSocket>();

// 청산가 계산
const MAINTENANCE_MARGIN_RATE = 0.005;

const MAKER_FEE_RATE = 0.0002;
const TAKER_FEE_RATE = 0.0005;

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
// 유저에게 이벤트 전송
export const sendToUser = (userId: number, data: object) => {
  const clientWs = userSocketMap.get(userId);
  if (clientWs && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify(data));
  }
};
// 자동 청산 체크
const checkLiquidation = async (currentPrice: number) => {
  try {
    // Cross 포지션 청산가 먼저 재계산
    const crossPositions = await prisma.position.findMany({
      where: { status: "open", marginType: "cross" },
      include: { user: { include: { wallet: true } } },
    });

    for (const pos of crossPositions) {
      const wallet = pos.user.wallet;
      if (!wallet) continue;

      const walletTotal = wallet.balance + wallet.locked;
      const newLiqPrice =
        pos.side === "long"
          ? pos.entryPrice -
            (walletTotal * (1 - MAINTENANCE_MARGIN_RATE)) / pos.size
          : pos.entryPrice +
            (walletTotal * (1 - MAINTENANCE_MARGIN_RATE)) / pos.size;

      // 청산가 업데이트
      await prisma.position.update({
        where: { id: pos.id },
        data: { liquidationPrice: newLiqPrice },
      });
    }

    // 청산 대상 찾기 (청산가 + TP/SL 통합)
    const positions = await prisma.position.findMany({
      where: {
        status: "open",
        OR: [
          // 기존 청산가 조건
          { side: "long", liquidationPrice: { gte: currentPrice } },
          { side: "short", liquidationPrice: { lte: currentPrice } },
          // TP 조건
          { side: "long", takeProfit: { lte: currentPrice } },
          { side: "short", takeProfit: { gte: currentPrice } },
          // SL 조건
          { side: "long", stopLoss: { gte: currentPrice } },
          { side: "short", stopLoss: { lte: currentPrice } },
        ],
      },
    });

    if (positions.length === 0) return;

    for (const position of positions) {
      // 청산 유형 판단
      const isLiquidation =
        (position.side === "long" &&
          currentPrice <= position.liquidationPrice) ||
        (position.side === "short" &&
          currentPrice >= position.liquidationPrice);

      const isTP =
        position.takeProfit &&
        ((position.side === "long" && currentPrice >= position.takeProfit) ||
          (position.side === "short" && currentPrice <= position.takeProfit));

      const isSL =
        position.stopLoss &&
        ((position.side === "long" && currentPrice <= position.stopLoss) ||
          (position.side === "short" && currentPrice >= position.stopLoss));

      // 손익 계산
      const pnl =
        position.side === "long"
          ? (currentPrice - position.entryPrice) * position.size
          : (position.entryPrice - currentPrice) * position.size;

      const fee = parseFloat(
        (currentPrice * position.size * TAKER_FEE_RATE).toFixed(8),
      );

      const returnAmount = isLiquidation
        ? 0
        : Math.max(position.margin + pnl - fee, 0);

      const closeStatus = isLiquidation ? "liquidated" : "closed";

      const closeMessage = isLiquidation
        ? "포지션이 강제청산됐어요!"
        : isTP
          ? "TP 목표가에 도달해 청산됐어요!"
          : "SL 손절가에 도달해 청산됐어요!";

      await prisma.$transaction(async (tx) => {
        transitionPosition(position.status, closeStatus);

        await tx.position.update({
          where: { id: position.id },
          data: { status: closeStatus, pnl },
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
            fee,
            feeType: "taker",
            orderRole: "close",
          },
        });

        await tx.wallet.update({
          where: { userId: position.userId },
          data: {
            balance: { increment: returnAmount },
            locked: { decrement: position.margin },
          },
        });
      });

      sendToUser(position.userId, {
        type: isLiquidation ? "liquidated" : "filled",
        positionId: position.id,
        message: closeMessage,
      });

      console.log(
        `포지션 ${position.id} ${closeMessage} 현재가: ${currentPrice}`,
      );
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
        const actualMargin = (currentPrice * order.size) / order.leverage;
        const marginDiff = actualMargin - order.margin;
        // taker 체결 시 추가 증거금 필요하면 잔고 체크
        if (marginDiff > 0) {
          const wallet = await tx.wallet.findUnique({
            where: { userId: order.userId },
          });

          if (!wallet || wallet.balance < marginDiff) {
            // 잔고 부족 → 주문 취소 + 기존 증거금 환불
            transitionOrder(order.status, "cancelled");
            await tx.order.update({
              where: { id: order.id },
              data: { status: "cancelled" },
            });
            await tx.wallet.update({
              where: { userId: order.userId },
              data: {
                balance: { increment: order.margin },
                locked: { decrement: order.margin },
              },
            });
            return;
          }

          // 추가 증거금 차감
          await tx.wallet.update({
            where: { userId: order.userId },
            data: {
              balance: { decrement: marginDiff },
              locked: { increment: marginDiff },
            },
          });
        }

        const liquidationPrice = calcLiquidationPrice(
          order.side,
          currentPrice,
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
        // taker/maker 판별
        const feeType = order.feeType ?? "maker";
        const feeRate = feeType === "taker" ? TAKER_FEE_RATE : MAKER_FEE_RATE;
        const fee = parseFloat(
          (currentPrice * order.size * feeRate).toFixed(8),
        );

        if (existing) {
          // 기존 포지션 합산
          const newSize = existing.size + order.size;
          const newMargin = existing.margin + actualMargin;
          const newEntryPrice =
            (existing.entryPrice * existing.size + currentPrice * order.size) /
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
              leverage: order.leverage,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "filled",
              positionId: existing.id,
              fee,
              feeType,
              orderRole: "open",
            },
          });
        } else {
          // 새 포지션 생성
          const position = await tx.position.create({
            data: {
              userId: order.userId,
              side: order.side,
              size: order.size,
              entryPrice: currentPrice,
              leverage: order.leverage,
              margin: actualMargin,
              liquidationPrice,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "filled",
              positionId: position.id,
              fee,
              feeType,
              orderRole: "open",
            },
          });
        }

        await tx.wallet.update({
          where: { userId: order.userId },
          data: { balance: { decrement: fee } },
        });
      });

      console.log(`지정가 주문 ${order.id} 체결! 현재가: ${currentPrice}`);
      sendToUser(order.userId, {
        type: "filled",
        orderId: order.id,
        message: "지정가 주문이 체결됐어요!",
      });
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
  // const ws = new WebSocket("wss://fstream.binance.com/ws/btcusdt@aggTrade"); // 선물체결데이터
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade"); // 현물체결데이터

  let latestTrade: TradeData | null = null;
  let lastSentTrade: TradeData | null = null;

  ws.on("open", () => {
    console.log("바이낸스 체결가 WebSocket 연결됐어요!");
  });

  ws.on("message", (data) => {
    // 1. 데이터가 오긴 오는지 원시 데이터(Raw)로 무조건 찍어보기
    // console.log("체결가 오냐");
    // console.log("체결가 데이터 도착!!!", data.toString());
    try {
      const message = JSON.parse(data.toString()); // 안전하게 문자열 변환 후 파싱
      const trade = JSON.parse(data.toString());
      latestPrice = parseFloat(trade.p); // 실시간 가격 저장
      // console.log(latestPrice);
      // console.log(trade.p);
      latestTrade = {
        type: "체결가",
        price: parseFloat(trade.p).toFixed(2),
        // quantity: trade.q, // 선물 데이터
        quantity: `${(trade.q as number) * 100}`, // 현물데이터
        time: trade.T,
      };
      latestTradeData = latestTrade;
    } catch (error) {
      console.error("체결가 파싱 에러:", error);
    }
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
    // await checkLiquidation(currentPrice);
    // await checkLimitOrders(currentPrice);
  }, 100);

  // 청산, 지정가체결체크를 매초마다 하면 부하가 걸려 걸리는 순간 db 먹통되서 체결가 발송되지않음. 체크가 끝나면 다시 실행하도록 수정.
  const startLiquidationCheck = async (currentPrice: number) => {
    // currentPrice가 0이면 실행하지 않음
    if (!currentPrice) {
      setTimeout(() => {
        if (latestPrice) startLiquidationCheck(latestPrice);
      }, 1000);
      return;
    }
    try {
      await checkLiquidation(currentPrice);
      await checkLimitOrders(currentPrice);
    } catch (err) {
      console.error("체크 로직 에러:", err);
    } finally {
      // 모든 작업이 끝난 "후에" 1초 뒤에 다시 호출
      setTimeout(() => {
        if (latestPrice) startLiquidationCheck(latestPrice);
      }, 1000);
    }
  };
  startLiquidationCheck(latestPrice);
};

// 바이낸스 호가창 호출 ws (기존 코드 그대로)
export const connectBinanceCall = (wss: WebSocketServer) => {
  const ws = new WebSocket(`wss://stream.binance.com/ws/btcusdt@depth10`);
  // const ws = new WebSocket(`wss://fstream.binance.com/ws/btcusdt@depth10`);

  ws.on("open", () => {
    console.log("바이낸스 호가창 WebSocket 연결됐어요!");
  });

  let latestTrade: DepthData | null = null;
  let lastSentString: string = "";

  ws.on("message", (data) => {
    // const trade = JSON.parse(data.toString());
    // // console.log(trade);
    // // 데이터 변환 함수: 소수점 제한 및 키 부여
    // const formatOrders = (orders: any) => {
    //   if (!orders) return [];
    //   return orders.map((order: any) => ({
    //     price: parseFloat(order[0]).toFixed(1), // 가격 소수점 2자리 (예: 68402.80)
    //     quantity: parseFloat(order[1]).toFixed(3), // 수량 소수점 5자리 (예: 1.17302)
    //   }));
    // };

    // latestTrade = {
    //   type: "호가창",
    //   bids: formatOrders(trade.b),
    //   asks: formatOrders(trade.a),
    // };

    //
    const trade = JSON.parse(data.toString());
    // console.log(trade);

    // 데이터 변환 함수: 소수점 제한 및 키 부여
    const formatOrders = (orders: any) => {
      if (!orders) return [];
      return orders.map((order: any) => ({
        // order[0]은 가격, order[1]은 수량입니다.
        price: parseFloat(order[0]).toFixed(2),
        quantity: (parseFloat(order[1]) * 100).toFixed(3),
      }));
    };

    // 새로운 데이터 형식에 맞춰 trade.bids와 trade.asks를 참조합니다.
    latestTrade = {
      type: "호가창",
      bids: formatOrders(trade.bids), // 기존 trade.b -> trade.bids로 변경
      asks: formatOrders(trade.asks), // 기존 trade.a -> trade.asks로 변경
    };
    latestDepth = latestTrade;
    // console.log(trade);
    // console.log(latestTrade);

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
