"use client";

import { useFutureStore } from "@/store/useFutureStore";
import { useEffect, useState, useRef } from "react";
export const getUsdtPrice = async () => {
  try {
    const response = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
    );
    const data = await response.json();
    return data[0].trade_price;
  } catch (error) {
    console.error("USDT 가격 로드 실패:", error);
    return 0;
  }
};

type Trade = {
  price: string;
  quantity: string;
  time: number;
  isBuy: boolean;
};

type Tab = "orderbook" | "trades";

export default function OrderBook() {
  const [usdtPrice, setUsdtPrice] = useState<number>(0);
  const [tab, setTab] = useState<Tab>("orderbook");
  const [trades, setTrades] = useState<Trade[]>([]);
  const prevPriceRef = useRef<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
        );
        const data = await response.json();
        setUsdtPrice(data[0].trade_price);
      } catch (error) {
        console.error("USDT 로드 실패:", error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const depthData = useFutureStore((state) => state.depthData);
  const tradeData = useFutureStore((state) => state.tradeData);
  const setSelectedPrice = useFutureStore((state) => state.setSelectedPrice);

  // tradeData 업데이트 시 trades 목록에 추가
  useEffect(() => {
    if (!tradeData) return;

    const currentPrice = parseFloat(tradeData.price);
    const isBuy = currentPrice >= prevPriceRef.current;
    prevPriceRef.current = currentPrice;

    setTrades((prev) => [
      {
        price: tradeData.price,
        quantity: tradeData.quantity,
        time: tradeData.time,
        isBuy,
      },
      ...prev.slice(0, 49), // 최대 50개 유지
    ]);
  }, [tradeData]);

  const price = tradeData ? parseFloat(tradeData.price) : 0;

  const allQuantities = [...depthData.asks, ...depthData.bids].map((d) =>
    parseFloat(d.quantity),
  );
  const maxQuantity = Math.max(...allQuantities, 0.0001);
  // asks: 중앙(index 0)부터 위로 누적
  const asksCumulative = depthData.asks.map((_, i) =>
    depthData.asks
      .slice(0, i + 1)
      .reduce((sum, a) => sum + parseFloat(a.quantity), 0),
  );

  // bids: 중앙(index 0)부터 아래로 누적
  const bidsCumulative = depthData.bids.map((_, i) =>
    depthData.bids
      .slice(0, i + 1)
      .reduce((sum, b) => sum + parseFloat(b.quantity), 0),
  );

  // 전체 기준 최대값
  const maxCumulative = Math.max(...asksCumulative, ...bidsCumulative, 0.0001);

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
    <div className="w-full h-full flex flex-col text-xs bg-[#161a1e] select-none text-gray-200 overflow-hidden">
      {/* 탭 */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setTab("orderbook")}
          className={`flex-1 py-2 text-xs transition-colors ${
            tab === "orderbook"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          호가창
        </button>
        <button
          onClick={() => setTab("trades")}
          className={`flex-1 py-2 text-xs transition-colors ${
            tab === "trades"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          체결 내역
        </button>
      </div>

      {/* 호가창 탭 */}
      {tab === "orderbook" && (
        <>
          {/* 헤더 */}
          <div className="flex justify-between px-2 py-1 text-gray-500 border-b border-gray-800 font-medium">
            <span>가격(USDT)</span>
            <span>수량(BTC)</span>
          </div>

          {/* 매도 호가 */}
          <div className="flex-1 flex flex-col-reverse overflow-hidden">
            {depthData.asks.map((ask, i) => {
              // const ratio = (parseFloat(ask.quantity) / maxQuantity) * 100; // 각 ratio
              const ratio = (asksCumulative[i] / maxCumulative) * 100; // 누적ratio

              return (
                <div
                  key={`ask-${i}`}
                  className="flex justify-between px-2 py-0.5 relative hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedPrice(parseFloat(ask.price))}
                >
                  <div
                    className="absolute right-0 top-0 bottom-[1px] bg-red-500/15 transition-all duration-200 ease-out"
                    style={{
                      width: `${ratio}%`,
                      minWidth: ratio > 0 ? "2px" : "0",
                    }}
                  />
                  <span className="text-red-400 z-10">
                    {parseFloat(ask.price)
                      .toFixed(1)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                  <span className="z-10 font-mono">{ask.quantity}</span>
                </div>
              );
            })}
          </div>

          {/* 현재가 */}
          <div className="flex items-center justify-between px-2 py-2 border-y border-gray-800 bg-[#1e2329]">
            <div className="flex flex-col">
              <span
                className={`text-lg font-bold transition-colors duration-300 ${priceTypeColor}`}
                onClick={() => setSelectedPrice(price)}
              >
                {price.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </span>
              <span className="text-[10px] text-gray-500">
                ≈ ${(price * 1).toLocaleString()}
                <br />≈ ₩{(price * usdtPrice).toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 text-right">
              <div>Spread</div>
              <div>{(lastAsks - firstBids).toFixed(2)}</div>
            </div>
          </div>

          {/* 매수 호가 */}
          <div className="flex-1 overflow-hidden">
            {depthData.bids.map((bid, i) => {
              // const ratio = (parseFloat(bid.quantity) / maxQuantity) * 100; // 각 ratio
              const ratio = (bidsCumulative[i] / maxCumulative) * 100; // 누적ratio

              return (
                <div
                  key={`bid-${i}`}
                  className="flex justify-between px-2 py-0.5 relative hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedPrice(parseFloat(bid.price))}
                >
                  <div
                    className="absolute right-0 top-0 bottom-[1px] bg-green-500/15 transition-all duration-200 ease-out"
                    style={{
                      width: `${ratio}%`,
                      minWidth: ratio > 0 ? "2px" : "0",
                    }}
                  />
                  <span className="text-green-400 z-10">
                    {parseFloat(bid.price)
                      .toFixed(1)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                  <span className="z-10 font-mono">{bid.quantity}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 체결 내역 탭 */}
      {tab === "trades" && (
        <>
          <div className="flex justify-between px-2 py-1 text-gray-500 border-b border-gray-800 font-medium">
            <span>가격(USDT)</span>
            <span>수량(BTC)</span>
            <span>시간</span>
          </div>
          <div className="flex-1 overflow-y-auto h-0">
            {trades.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                체결 데이터 로딩중...
              </div>
            ) : (
              trades.map((trade, i) => (
                <div
                  key={i}
                  className="flex justify-between px-2 py-0.5 hover:bg-white/5"
                >
                  <span
                    className={trade.isBuy ? "text-green-400" : "text-red-400"}
                  >
                    {parseFloat(trade.price)
                      .toFixed(1)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                  <span className="text-gray-300 font-mono">
                    {parseFloat(trade.quantity).toFixed(3)}
                  </span>
                  <span className="text-gray-500">
                    {new Date(trade.time).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
