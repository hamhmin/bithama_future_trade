import WebSocket from "ws";

export const connectBinance = () => {
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

  ws.on("open", () => {
    console.log("바이낸스 WebSocket 연결됐어요!");
  });

  ws.on("message", (data) => {
    const trade = JSON.parse(data.toString());
    console.log(`BTC 체결가: ${trade.p}`);
  });

  ws.on("close", () => {
    console.log("연결 끊겼어요. 재연결 시도...");
    setTimeout(connectBinance, 3000); // 3초 후 재연결
  });

  ws.on("error", (err) => {
    console.error("WebSocket 오류:", err);
  });
};
