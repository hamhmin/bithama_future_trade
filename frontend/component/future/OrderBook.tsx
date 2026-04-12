"use client";

import { useFutureStore } from "@/store/useFutureStore";
import { useEffect, useState } from "react";
// USDT 가격을 가져오는 단순 fetch 함수
export const getUsdtPrice = async () => {
  try {
    const response = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
    );
    const data = await response.json();
    return data[0].trade_price; // 숫자형태의 원화 가격 반환
  } catch (error) {
    console.error("USDT 가격 로드 실패:", error);
    return 0;
  }
};

export default function OrderBook() {
  // 테더 가격 호출
  const [usdtPrice, setUsdtPrice] = useState<number>(0);
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
        );
        const data = await response.json();
        setUsdtPrice(data[0].trade_price);
        // console.log(data[0].trade_price);
      } catch (error) {
        console.error("USDT 로드 실패:", error);
      }
    };

    fetchPrice();

    // 1분마다 갱신
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const depthData = useFutureStore((state) => state.depthData);
  const tradeData = useFutureStore((state) => state.tradeData);

  // 1. 현재가 및 호가 데이터 수치화
  const price = tradeData ? parseFloat(tradeData.price) : 0;

  // 2. 최대 수량 계산 (전체 호가 중 가장 큰 수량을 100% 기준으로 삼음)
  const allQuantities = [...depthData.asks, ...depthData.bids].map((d) =>
    parseFloat(d.quantity),
  );
  const maxQuantity = Math.max(...allQuantities, 0.0001);

  // 3. 현재가 상태(Type) 판별 로직
  const lastAsks = parseFloat(depthData.asks[0]?.price || "0");
  const firstBids = parseFloat(depthData.bids[0]?.price || "0");

  const priceType =
    price >= lastAsks ? "bids" : price <= firstBids ? "asks" : "current";
  const priceTypeColor =
    priceType === "bids"
      ? "text-green-400"
      : priceType === "asks"
        ? "text-red-400"
        : "text-white";

  return (
    <div className="w-full h-full flex flex-col text-xs bg-[#161a1e] select-none text-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between px-2 py-1 text-gray-500 border-b border-gray-800 font-medium">
        <span>가격(USDT)</span>
        <span>수량(BTC)</span>
      </div>

      {/* 매도 호가 (Asks) - 아래에서 위로 쌓임 */}
      <div className="flex-1 flex flex-col-reverse overflow-hidden">
        {depthData.asks.map((ask, i) => {
          const ratio = (parseFloat(ask.quantity) / maxQuantity) * 100;
          return (
            <div
              key={`ask-${i}`}
              className="flex justify-between px-2 py-0.5 relative hover:bg-white/5 cursor-pointer transition-colors"
            >
              {/* 수량 바: 최소 크기를 1.5% 정도로 설정 (min-width) */}
              <div
                className="absolute right-0 top-0 bottom-[1px] bg-red-500/15 transition-all duration-200 ease-out"
                style={{
                  width: `${ratio}%`,
                  minWidth: ratio > 0 ? "2px" : "0",
                }}
              />
              <span className="text-red-400 z-10">
                {parseFloat(ask.price).toLocaleString()}
              </span>
              <span className="z-10 font-mono">{ask.quantity}</span>
            </div>
          );
        })}
      </div>

      {/* [복구] 중앙 현재가 영역 */}
      <div className="flex items-center justify-between px-2 py-2 border-y border-gray-800 bg-[#1e2329]">
        <div className="flex flex-col">
          <span
            className={`text-lg font-bold transition-colors duration-300 ${priceTypeColor}`}
          >
            {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-gray-500">
            ≈ ${(price * 1).toLocaleString()}
            <br></br>≈ ₩{(price * usdtPrice).toLocaleString()}
          </span>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          <div>Spread</div>
          <div>{(lastAsks - firstBids).toFixed(2)}</div>
        </div>
      </div>

      {/* 매수 호가 (Bids) - 위에서 아래로 쌓임 */}
      <div className="flex-1 overflow-hidden">
        {depthData.bids.map((bid, i) => {
          const ratio = (parseFloat(bid.quantity) / maxQuantity) * 100;
          return (
            <div
              key={`bid-${i}`}
              className="flex justify-between px-2 py-0.5 relative hover:bg-white/5 cursor-pointer transition-colors"
            >
              {/* 수량 바: 최소 크기 설정 */}
              <div
                className="absolute right-0 top-0 bottom-[1px] bg-green-500/15 transition-all duration-200 ease-out"
                style={{
                  width: `${ratio}%`,
                  minWidth: ratio > 0 ? "2px" : "0",
                }}
              />
              <span className="text-green-400 z-10">
                {parseFloat(bid.price).toLocaleString()}
              </span>
              <span className="z-10 font-mono">{bid.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
