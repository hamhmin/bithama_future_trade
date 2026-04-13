"use client";

import { useFutureStore } from "@/store/useFutureStore";
import { useEffect, useState } from "react";

type TickerData = {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
};

export default function FutureHeader() {
  const tradeData = useFutureStore((state) => state.tradeData);
  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [prevPrice, setPrevPrice] = useState(0);
  const [priceUp, setPriceUp] = useState(true);

  // 24시간 티커 데이터 가져오기
  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch(
          "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT"
        );
        const data = await res.json();
        setTicker(data);
      } catch {
        console.error("티커 로딩 실패");
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 10000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 현재가 등락 방향 감지
  useEffect(() => {
    if (currentPrice && prevPrice) {
      setPriceUp(currentPrice >= prevPrice);
    }
    setPrevPrice(currentPrice);
  }, [currentPrice]);

  const changePercent = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="w-full h-full flex items-center gap-6 px-4 text-sm">

      {/* 심볼 */}
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-base">BTCUSDT</span>
        <span className="text-gray-400 text-xs">무기한</span>
      </div>

      {/* 현재가 */}
      <div className="flex flex-col">
        <span
          className={`font-bold text-lg transition-colors ${
            priceUp ? "text-green-400" : "text-red-400"
          }`}
        >
          {currentPrice > 0 ? currentPrice.toLocaleString() : "-"}
        </span>
        <span
          className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* 24시간 고가 */}
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">24H 고가</span>
        <span className="text-white text-xs">
          {ticker ? parseFloat(ticker.highPrice).toLocaleString() : "-"}
        </span>
      </div>

      {/* 24시간 저가 */}
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">24H 저가</span>
        <span className="text-white text-xs">
          {ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "-"}
        </span>
      </div>

      {/* 24시간 거래량 */}
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">24H 거래량 (BTC)</span>
        <span className="text-white text-xs">
          {ticker
            ? parseFloat(ticker.volume).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            : "-"}
        </span>
      </div>
    </div>
  );
}