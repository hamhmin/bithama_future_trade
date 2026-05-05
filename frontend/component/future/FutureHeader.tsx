"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "../common/GuestModal";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchMe } from "@/lib/queries";

type TickerData = {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
};

export default function FutureHeader({ initialTrade }: { initialTrade: any }) {
  // console.count("FutureHeader render");

  const router = useRouter();
  const queryClient = useQueryClient();
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const currentPrice = useFutureStore((state) =>
    state.tradeData
      ? parseFloat(state.tradeData.price)
      : initialTrade
        ? parseFloat(initialTrade.price)
        : 0,
  );
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [prevPrice, setPrevPrice] = useState(0);
  const [priceUp, setPriceUp] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"select" | "login" | "register">(
    "select",
  );

  const isLoggedIn = authStatus === "logged-in";

  // me 쿼리 (OrderPanel과 캐시 공유)
  const { data: userInfo } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: fetchMe,
    enabled: isLoggedIn,
  });

  // 24시간 티커
  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch(
          "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT",
        );
        const data = await res.json();
        setTicker(data);
      } catch {
        console.error("티커 로딩 실패");
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 10000);
    return () => clearInterval(interval);
  }, []);

  // 현재가 등락 감지
  useEffect(() => {
    if (currentPrice && prevPrice) {
      setPriceUp(currentPrice >= prevPrice);
    }
    setPrevPrice(currentPrice);
  }, [currentPrice]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setAuthStatus("guest");
      queryClient.clear(); // 로그아웃 시 모든 캐시 초기화
      router.refresh();
    } catch {}
  };

  const changePercent = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="w-full h-full flex items-center justify-between px-4 text-sm">
      {/* 데스크탑 */}
      <div className="hidden lg:flex items-center gap-6 w-full">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base">BTCUSDT</span>
          <span className="text-gray-500 text-xs">무기한</span>
        </div>
        <div className="flex flex-col">
          <span
            className={`font-bold text-lg transition-colors ${priceUp ? "text-green-400" : "text-red-400"}`}
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
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 고가</span>
          <span className="text-white text-xs">
            {ticker ? parseFloat(ticker.highPrice).toLocaleString() : "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 저가</span>
          <span className="text-white text-xs">
            {ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 거래량</span>
          <span className="text-white text-xs">
            {ticker
              ? parseFloat(ticker.volume).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              : "-"}{" "}
            BTC
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isLoggedIn && userInfo ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-xs">가용 잔고</span>
                <span className="text-white text-xs font-bold">
                  {userInfo.wallet?.balance.toFixed(2)} USDT
                </span>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <span className="text-gray-300 text-sm">{userInfo.nickname}</span>
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
                onClick={() => {
                  setModalMode("login");
                  setShowModal(true);
                }}
                className="px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => {
                  setModalMode("register");
                  setShowModal(true);
                }}
                className="px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
              >
                회원가입
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* 모바일 */}
      <div className="flex lg:hidden flex-col w-full py-1 gap-0.5">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-blue-400 font-bold text-sm shrink-0">
            BITHAMA
          </Link>
          <div className="w-px h-4 bg-gray-700 shrink-0" />
          <span
            className={`font-bold text-sm transition-colors shrink-0 ${priceUp ? "text-green-400" : "text-red-400"}`}
          >
            {currentPrice > 0 ? currentPrice.toLocaleString() : "-"}
          </span>
          <span
            className={`text-[10px] shrink-0 ${isPositive ? "text-green-400" : "text-red-400"}`}
          >
            {isPositive ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {isLoggedIn && userInfo ? (
              <button
                onClick={handleLogout}
                className="px-2 py-0.5 rounded text-[10px] text-gray-400 border border-gray-700"
              >
                로그아웃
              </button>
            ) : authStatus === "guest" ? (
              <button
                onClick={() => {
                  setModalMode("login");
                  setShowModal(true);
                }}
                className="px-2 py-0.5 rounded text-[10px] text-white bg-blue-600"
              >
                로그인
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-white font-bold shrink-0">BTCUSDT</span>
          <span className="text-gray-500">
            고가{" "}
            <span className="text-white">
              {ticker ? parseFloat(ticker.highPrice).toLocaleString() : "-"}
            </span>
          </span>
          <span className="text-gray-500">
            저가{" "}
            <span className="text-white">
              {ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "-"}
            </span>
          </span>
          <span className="text-gray-500">
            거래량{" "}
            <span className="text-white">
              {ticker
                ? parseFloat(ticker.volume).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : "-"}
            </span>
          </span>
          {isLoggedIn && userInfo && (
            <span className="ml-auto text-gray-500">
              잔고{" "}
              <span className="text-white font-bold">
                {userInfo.wallet?.balance.toFixed(2)} USDT
              </span>
            </span>
          )}
        </div>
      </div>

      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
