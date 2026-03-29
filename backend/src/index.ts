import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
