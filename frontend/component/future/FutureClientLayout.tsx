"use client";

import { useState, useRef } from "react";
import FutureHeader from "@/component/future/FutureHeader";
import PositionPanel from "@/component/future/PositionPanel";
import TradeInfo from "@/component/future/TradeInfo";
import OrderBook from "@/component/future/OrderBook";
import OrderPanel from "@/component/future/OrderPanel";
import TradingChart from "@/component/future/TradingChart";
import SocketProvider from "@/component/future/SocketProvider";
import TickerScroll from "@/component/future/TickerScroll";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "@/component/common/GuestModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchMe } from "@/lib/queries";

export default function FutureClientLayout({
  depth,
  trade,
  initialCandles = [],
}: {
  depth: any;
  trade: any;
  initialCandles?: any[];
}) {
  const [chartOpen, setChartOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isDesktop = useIsDesktop();
  const positionPanelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const isLoggedIn = authStatus === "logged-in";

  const { data: userInfo } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: fetchMe,
    enabled: isLoggedIn,
  });

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setAuthStatus("guest");
      queryClient.clear();
      router.refresh();
    } catch {}
  };

  return (
    <>
      <SocketProvider />
      {isDesktop === null ? (
        <div className="h-screen bg-[#050d1a] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isDesktop ? (
        /* 데스크탑 레이아웃 */
        <div className="grid h-full bg-[#050d1a] text-white grid-cols-12 grid-rows-[40px_48px_24px_1fr_340px]">
          {/* PC 상단 헤더 - 로고 + 프로필 + 로그아웃 */}
          <div className="col-span-12 border-b border-gray-700 flex items-center justify-between px-4">
            {/* 로고 */}
            <Link
              href="/"
              className="text-blue-400 font-bold text-base hover:text-blue-300 transition-colors"
            >
              BITHAMA
            </Link>

            {/* 우측 */}
            <div className="flex items-center gap-3">
              {isLoggedIn && userInfo ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-300 text-sm hover:text-white transition-colors"
                  >
                    👤 {userInfo.nickname}
                  </Link>
                  <div className="w-px h-4 bg-gray-700" />
                  <span className="text-gray-500 text-xs">
                    잔고{" "}
                    <span className="text-white font-bold">
                      {userInfo.wallet?.balance.toFixed(2)} USDT
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded text-xs text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : authStatus === "guest" ? (
                <>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    회원가입
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* PC 시세 헤더 */}
          <div className="col-span-12 border-b border-gray-700">
            <FutureHeader initialTrade={trade} />
          </div>

          {/* 티커 스크롤 */}
          <div className="col-span-12 h-6 overflow-hidden">
            <TickerScroll />
          </div>
          <div className="col-span-7 border-r border-gray-700">
            <TradingChart initialCandles={initialCandles} />
          </div>
          <div className="col-span-2 border-r border-gray-700 overflow-hidden">
            <OrderBook initialDepth={depth} initialTrade={trade} />
          </div>
          <div className="col-span-3">
            <OrderPanel positionPanelRef={positionPanelRef} />
          </div>
          <div
            className="col-span-9 border-t border-r border-gray-700"
            ref={positionPanelRef}
          >
            <PositionPanel />
          </div>
          <div className="col-span-3 border-t border-gray-700">
            <TradeInfo />
          </div>
        </div>
      ) : (
        /* 모바일 레이아웃 */
        <div className="flex flex-col bg-[#050d1a] text-white h-full">
          {/* 모바일 전용 헤더 - 로고 + 프로필 + 로그인 */}
          <div className="flex items-center justify-between px-4 h-10 border-b border-gray-700 shrink-0">
            {/* 로고 */}
            <Link href="/" className="text-blue-400 font-bold text-sm">
              BITHAMA
            </Link>

            {/* 우측 버튼 */}
            <div className="flex items-center gap-2">
              {isLoggedIn && userInfo ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-300 text-xs hover:text-white transition-colors"
                  >
                    👤 {userInfo.nickname}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-2 py-0.5 rounded text-[10px] text-gray-400 border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : authStatus === "guest" ? (
                <>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-2 py-1 rounded text-[10px] text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-2 py-1 rounded text-[10px] text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    회원가입
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* FutureHeader - 시세 정보만 */}
          <div className="border-b border-gray-700 shrink-0 px-4 py-1.5">
            <FutureHeader initialTrade={trade} />
          </div>

          {/* 상단 - 주문 + 호가창 */}
          <div className="flex border-b border-gray-700">
            <div className="flex-1 min-w-0 border-r border-gray-700 overflow-y-auto">
              <OrderPanel positionPanelRef={positionPanelRef} />
            </div>
            <div className="w-44 shrink-0 overflow-hidden">
              <OrderBook initialDepth={depth} initialTrade={trade} />
            </div>
          </div>

          {/* 하단 - 포지션패널 */}
          <div className="flex-1 overflow-hidden" ref={positionPanelRef}>
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
                <TradingChart initialCandles={initialCandles} />
              </div>
            </div>
          )}
        </div>
      )}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </>
  );
}
