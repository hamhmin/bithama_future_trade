import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import { connectBinance } from "./websocket.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "bit-hama backend running!" });
});
app.get("/future", (req, res) => {
  res.json({ message: "bit-hama future backend running!" });
  console.log("future 접속");
});
app.use("/api/auth", authRouter);

// HTTP 서버 + WebSocket 서버 같이 생성
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", () => {
  console.log("프론트 WebSocket 연결됐어요!");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectBinance(wss);
});
