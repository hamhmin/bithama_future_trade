"use client";

import { useEffect, useState } from "react";

type TickerItem = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

export default function TickerScroll() {
  // console.count("TickerScroll render");

  const [tickers, setTickers] = useState<TickerItem[]>([]);

  const fetchTickers = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/ticker-all`,
      );
      const data = await res.json();

      // 거래량 상위 20개 USDT 페어만
      const filtered = data
        .filter((t: any) => t.symbol.endsWith("USDT"))
        .sort(
          (a: any, b: any) =>
            parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
        )
        .slice(0, 20)
        .map((t: any) => ({
          symbol: t.symbol,
          lastPrice: parseFloat(t.lastPrice).toLocaleString(),
          priceChangePercent: parseFloat(t.priceChangePercent).toFixed(2),
        }));

      setTickers(filtered);
    } catch {
      console.error("티커 로딩 실패");
    }
  };

  useEffect(() => {
    fetchTickers();
    const interval = setInterval(fetchTickers, 10000);
    return () => clearInterval(interval);
  }, []);

  if (tickers.length === 0) return null;

  // 무한 스크롤을 위해 2번 반복
  const doubled = [...tickers, ...tickers];

  return (
    <div className="w-full overflow-hidden bg-gray-900 border-b border-gray-800 h-6 flex items-center">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((ticker, i) => {
          const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-4 text-xs cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-300 font-medium">{ticker.symbol}</span>
              <span className="text-white">{ticker.lastPrice}</span>
              <span className={isPositive ? "text-green-400" : "text-red-400"}>
                {isPositive ? "+" : ""}
                {ticker.priceChangePercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
