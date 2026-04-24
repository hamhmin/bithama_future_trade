"use client";

import { useState } from "react";
import FutureHeader from "@/component/future/FutureHeader";
import PositionPanel from "@/component/future/PositionPanel";
import TradeInfo from "@/component/future/TradeInfo";
import OrderBook from "@/component/future/OrderBook";
import OrderPanel from "@/component/future/OrderPanel";
import TradingChart from "@/component/future/TradingChart";
import SocketProvider from "@/component/future/SocketProvider";
import TickerScroll from "@/component/future/TickerScroll";

type MobileTab = "chart" | "orderbook" | "order" | "position";

export default function FutureClientLayout({
  depth,
  trade,
}: {
  depth: any;
  trade: any;
}) {
  const [chartOpen, setChartOpen] = useState(false);

  return (
    <>
      {/* 데스크탑 레이아웃 (기존 그대로) */}
      <div className="hidden lg:grid h-screen bg-[#050d1a] text-white grid-cols-12 grid-rows-[48px_24px_1fr_340px]">
        <SocketProvider />
        <div className="col-span-12 border-b border-gray-700">
          <FutureHeader initialTrade={trade} />
        </div>
        {/* 티커 스크롤 */}
        <div className="col-span-12 h-6 overflow-hidden">
          <TickerScroll />
        </div>
        <div className="col-span-7 border-r border-gray-700">
          <TradingChart />
        </div>
        <div className="col-span-2 border-r border-gray-700 overflow-hidden">
          <OrderBook initialDepth={depth} initialTrade={trade} />
        </div>
        <div className="col-span-3">
          <OrderPanel />
        </div>
        <div className="col-span-9 border-t border-r border-gray-700">
          <PositionPanel />
        </div>
        <div className="col-span-3 border-t border-gray-700">
          <TradeInfo />
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="flex lg:hidden flex-col   bg-[#050d1a] text-white h-full">
        <SocketProvider />

        {/* 헤더 */}
        <div className="border-b border-gray-700 shrink-0 h-14">
          <FutureHeader initialTrade={trade} />
        </div>

        {/* 상단 - 주문 + 호가창 */}
        <div className="flex border-b border-gray-700">
          {/* 좌: 주문패널 */}
          <div className="flex-1 min-w-0 border-r border-gray-700 overflow-y-auto">
            <OrderPanel />
          </div>
          {/* 우: 호가창 */}
          <div className="w-44 shrink-0 overflow-hidden">
            <OrderBook initialDepth={depth} initialTrade={trade} />
          </div>
        </div>

        {/* 하단 - 포지션패널 */}
        <div className="flex-1 overflow-hidden">
          <PositionPanel />
        </div>

        {/* 차트 전체화면 버튼 */}
        <button
          onClick={() => setChartOpen(true)}
          className="fixed bottom-20 right-4 bg-blue-600 text-white text-xs px-3 py-2 rounded-full shadow-lg z-50"
        >
          📈 차트
        </button>

        {/* 차트 전체화면 오버레이 */}
        {chartOpen && (
          <div className="fixed inset-0 bg-[#050d1a] z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="text-white text-sm font-bold">차트</span>
              <button
                onClick={() => setChartOpen(false)}
                className="text-gray-400 text-sm"
              >
                ✕ 닫기
              </button>
            </div>
            <div className="flex-1">
              <TradingChart />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
