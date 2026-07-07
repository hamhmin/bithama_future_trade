import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import { connectBinanceQuote, connectBinanceCall } from "./websocket.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { startCandleSync } from "./candle.js";
import candleRouter from "./routes/candle.js";
import futureRouter from "./routes/future.js";
import rankingRouter from "./routes/ranking.js";
import adminRouter from "./routes/admin.js";
import cookieParser from "cookie-parser";
import { userSocketMap } from "./websocket.js";
import { startFundingScheduler } from "./funding.js";
import { i18nMiddleware } from "./middleware/i18n.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // 프론트 주소
    credentials: true, // 쿠키 허용 (중요!)
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(i18nMiddleware);
app.get("/", (req, res) => {
  res.json({ message: "bit-hama backend running!" });
});
app.get("/future", (req, res) => {
  res.json({ message: "bit-hama future backend running!" });
  console.log("future 접속");
});
app.use("/api/auth", authRouter);

app.use("/api/candles", candleRouter);

app.use("/api/future", futureRouter);
app.use("/api/ranking", rankingRouter);
app.use("/api/admin", adminRouter);

// HTTP 서버 + WebSocket 서버 같이 생성
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 프론트 소켓 연결 시 userId 등록
wss.on("connection", (clientWs) => {
  console.log("프론트 WebSocket 연결됐어요!");

  // heartbeat pong 응답 추가
  clientWs.on("ping", () => {
    clientWs.pong();
  });

  clientWs.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 프론트에서 auth 메시지 보내면 Map에 등록
      if (msg.type === "auth" && msg.userId) {
        userSocketMap.set(msg.userId, clientWs);
        console.log(`유저 ${msg.userId} 소켓 등록됐어요!`);
      }

      // ping 메시지로 오는 경우도 처리 (브라우저는 ws.ping() 없음)
      if (msg.type === "ping") {
        clientWs.send(JSON.stringify({ type: "pong" }));
      }
    } catch {}
  });

  // 연결 끊기면 Map에서 제거
  clientWs.on("close", () => {
    userSocketMap.forEach((ws, userId) => {
      if (ws === clientWs) {
        userSocketMap.delete(userId);
        console.log(`유저 ${userId} 소켓 제거됐어요!`);
      }
    });
  });
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectBinanceQuote(wss);
  connectBinanceCall(wss);
  startCandleSync();
  startFundingScheduler();
});
