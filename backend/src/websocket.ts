import WebSocket, { WebSocketServer } from "ws";

let latestTrade: any = null;

export const connectBinance = (wss: WebSocketServer) => {
  const ws = new WebSocket("wss://stream.binance.com/ws/btcusdt@trade");

  ws.on("open", () => {
    console.log("바이낸스 WebSocket 연결됐어요!");
  });

  ws.on("message", (data) => {
    const trade = JSON.parse(data.toString());
    // console.log(trade);
    latestTrade = {
      price: trade.p,
      quantity: trade.q,
      time: trade.T,
    };
  });

  ws.on("close", () => {
    console.log("연결 끊겼어요. 재연결 시도...");
    setTimeout(() => connectBinance(wss), 3000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket 오류:", err);
  });

  let latestTrade: any = null;
  let lastSentTrade: any = null;

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
