import WebSocket, { WebSocketServer } from "ws";

// let latestTrade: any = null;
// 타입 정의를 통해 any 사용 지양
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

// 바이낸스 체결가 호출 ws
export const connectBinanceQuote = (wss: WebSocketServer) => {
  const ws = new WebSocket("wss://stream.binance.com/ws/btcusdt@trade");
  let latestTrade: TradeData | null = null;
  let lastSentTrade: TradeData | null = null;

  ws.on("open", () => {
    console.log("바이낸스 체결가 WebSocket 연결됐어요!");
  });

  ws.on("message", (data) => {
    const trade = JSON.parse(data.toString());
    // console.log(trade);
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

  // 100ms마다 프론트에 브로드캐스트
  setInterval(() => {
    if (!latestTrade) return;

    // 3개 다 같으면 생략
    if (
      lastSentTrade &&
      lastSentTrade.price === latestTrade.price &&
      lastSentTrade.quantity === latestTrade.quantity &&
      lastSentTrade.time === latestTrade.time
    ) {
      return;
    }
    // console.log(latestTrade);

    lastSentTrade = latestTrade;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(latestTrade));
      }
    });
  }, 100);
};

// 바이낸스 호가창 호출 ws
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

    // console.log(trade);
    latestTrade = {
      type: "호가창",
      bids: formatOrders(trade.bids),
      asks: formatOrders(trade.asks),
    };

    // console.log(latestTrade);

    const currentString = JSON.stringify(latestTrade);

    if (currentString === lastSentString) {
      return;
    }
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
