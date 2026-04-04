import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../prisma.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { symbol = "BTCUSDT", interval = "1m" } = req.query;

  const candles = await prisma.candle.findMany({
    where: {
      symbol: symbol as string,
      interval: interval as string,
    },
    orderBy: { openTime: "asc" },
  });
  // BigInt → Number 변환
  const result = candles.map((c) => ({
    ...c,
    openTime: Number(c.openTime),
  }));

  res.json(result);
});

export default router;
