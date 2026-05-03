import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../prisma.js";

const router = Router();

// 바이낸스에서 특정 구간 캔들 가져와서 DB에 저장 후 반환
const fetchFromBinanceAndSave = async (
  symbol: string,
  interval: string,
  endTime: number,
  limit = 500,
) => {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&endTime=${endTime}&limit=${limit}`,
  );
  const data = await res.json();

  for (const candle of data) {
    await prisma.candle.upsert({
      where: {
        symbol_interval_openTime: { symbol, interval, openTime: candle[0] },
      },
      update: {
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      },
      create: {
        symbol,
        interval,
        openTime: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      },
    });
  }

  return data.map((c: any) => ({
    openTime: Number(c[0]),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }));
};

router.get("/", async (req: Request, res: Response) => {
  const { symbol = "BTCUSDT", interval = "1m", before } = req.query;
  const limit = 500;

  try {
    const whereClause: any = {
      symbol: symbol as string,
      interval: interval as string,
    };

    // before 있으면 그 이전 데이터 (스크롤 페이지네이션)
    if (before) {
      whereClause.openTime = { lt: Number(before) };
    }

    const candles = await prisma.candle.findMany({
      where: whereClause,
      orderBy: { openTime: "desc" },
      take: limit,
    });

    // DB에 데이터 없으면 바이낸스 fallback
    if (candles.length === 0 && before) {
      const fallback = await fetchFromBinanceAndSave(
        symbol as string,
        interval as string,
        Number(before),
        limit,
      );
      return res.json(fallback.reverse());
    }

    const result = candles
      .reverse()
      .map((c) => ({ ...c, openTime: Number(c.openTime) }));

    res.json(result);
  } catch (err) {
    console.error("캔들 조회 실패:", err);
    res.status(500).json({ message: "캔들 조회 실패" });
  }
});

export default router;
