import prisma from "./prisma.js";

const SYMBOL = "BTCUSDT";

// 인터벌별 보관 기간 설정
const RETENTION: Record<string, { limit: number; days: number }> = {
  "1m": { limit: 1500, days: 3 },
  "5m": { limit: 1500, days: 7 },
  "15m": { limit: 1500, days: 14 },
  "30m": { limit: 1500, days: 30 },
  "1h": { limit: 1500, days: 90 },
  "4h": { limit: 1500, days: 365 },
  "1d": { limit: 1500, days: 9999 }, // 전체
};

const INTERVALS = Object.keys(RETENTION);

// 바이낸스에서 캔들 데이터 가져오기
export const fetchAndSaveCandles = async (symbol: string, interval: string) => {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${RETENTION[interval]!.limit}`,
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
  } catch (err) {
    console.error(`${symbol} ${interval} 캔들 저장 실패:`, err);
  }
};

// 오래된 캔들 삭제
export const cleanOldCandles = async () => {
  for (const [interval, { days }] of Object.entries(RETENTION)) {
    if (days === 9999) continue; // 1d는 전체 보관
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    await prisma.candle.deleteMany({
      where: { symbol: SYMBOL, interval, openTime: { lt: cutoff } },
    });
  }
};

export const startCandleSync = () => {
  INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));

  // 1분마다 최신 캔들 업데이트
  setInterval(() => {
    INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));
  }, 60000);

  // 1시간마다 오래된 캔들 삭제
  setInterval(cleanOldCandles, 60 * 60 * 1000);
};
