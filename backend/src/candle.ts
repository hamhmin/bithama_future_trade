import prisma from "./prisma.js";

const SYMBOL = "BTCUSDT";
const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

// 바이낸스에서 캔들 데이터 가져오기
export const fetchAndSaveCandles = async (symbol: string, interval: string) => {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1500`, // 현물 데이터
    );
    const data = await res.json();

    for (const candle of data) {
      await prisma.candle.upsert({
        where: {
          symbol_interval_openTime: {
            symbol,
            interval,
            openTime: candle[0],
          },
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
    // console.log(`${symbol} ${interval} 캔들 저장 완료!`);
  } catch (err) {
    console.error(`${symbol} ${interval} 캔들 저장 실패:`, err);
  }
};

export const startCandleSync = () => {
  // 시작하자마자 모든 봉 저장
  INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));

  // 1분마다 업데이트
  setInterval(() => {
    INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));
  }, 60000);
};
