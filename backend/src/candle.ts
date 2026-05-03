import prisma from "./prisma.js";

const SYMBOL = "BTCUSDT";

// 인터벌별 보관 기간 설정

const RETENTION: Record<string, { days: number }> = {
  "1m": { days: 30 },
  "5m": { days: 30 },
  "15m": { days: 30 },
  "30m": { days: 30 },
  "1h": { days: 30 },
  "4h": { days: 30 },
  "1d": { days: 9999 },
};

const INTERVALS = Object.keys(RETENTION);

// 초기 적재 - 보관기간 전체를 페이지네이션으로 가져오기
const initialFetchCandles = async (symbol: string, interval: string) => {
  const days = RETENTION[interval].days;
  if (days === 9999) {
    // 1d는 한 번만 호출해도 충분
    await fetchAndSaveCandles(symbol, interval);
    return;
  }

  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;
  let currentEnd = endTime;

  console.log(`${symbol} ${interval} 초기 적재 시작...`);

  while (currentEnd > startTime) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&endTime=${currentEnd}&limit=1500`,
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

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

      // 가장 오래된 캔들 시간으로 이동
      currentEnd = Number(data[0][0]) - 1;

      // startTime보다 오래된 데이터면 종료
      if (Number(data[0][0]) <= startTime) break;

      // 바이낸스 Rate Limit 방지
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`${symbol} ${interval} 초기 적재 실패:`, err);
      break;
    }
  }

  console.log(`${symbol} ${interval} 초기 적재 완료!`);
};

// 바이낸스에서 캔들 데이터 가져오기
export const fetchAndSaveCandles = async (symbol: string, interval: string) => {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1500`,
    );
    const data = await res.json();

    // Rate Limit 걸리면 배열이 아닌 에러 객체 반환됨
    if (!Array.isArray(data)) {
      console.error(`${symbol} ${interval} 바이낸스 응답 오류:`, data);
      return;
    }

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

export const startCandleSync = async () => {
  // 초기 적재 (보관기간 전체)
  for (const interval of INTERVALS) {
    // DB에 해당 인터벌 데이터가 있는지 확인
    const count = await prisma.candle.count({
      where: { symbol: SYMBOL, interval },
    });

    if (count < 100) {
      // 거의 비어있으면 초기 적재
      console.log(`${interval} 데이터 부족 (${count}개) → 초기 적재 시작`);
      initialFetchCandles(SYMBOL, interval); // await 없이 비동기로 실행
    } else {
      console.log(`${interval} 데이터 있음 (${count}개) → 스킵`);
    }
  }

  // 1분마다 최신 캔들 업데이트
  // 수정: 순차 호출 (인터벌당 200ms 간격)
  setInterval(async () => {
    for (const interval of INTERVALS) {
      await fetchAndSaveCandles(SYMBOL, interval);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }, 60000);

  // 1시간마다 오래된 캔들 삭제
  setInterval(cleanOldCandles, 60 * 60 * 1000);
};
// export const startCandleSync = () => {
//   INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));

//   // 1분마다 최신 캔들 업데이트
//   setInterval(() => {
//     INTERVALS.forEach((interval) => fetchAndSaveCandles(SYMBOL, interval));
//   }, 60000);

//   // 1시간마다 오래된 캔들 삭제
//   setInterval(cleanOldCandles, 60 * 60 * 1000);
// };
