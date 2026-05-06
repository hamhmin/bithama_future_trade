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
    <div className="w-full h-full flex items-center justify-between  text-sm">
      {/* 데스크탑 - 시세 정보만 */}
      <div className="hidden lg:flex items-center gap-6 w-full px-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base">BTCUSDT</span>
          <span className="text-gray-500 text-xs">무기한</span>
        </div>
        <div className="flex gap-3 items-center">
          <span
            className={`font-bold text-lg transition-colors ${priceUp ? "text-green-400" : "text-red-400"}`}
          >
            {currentPrice > 0
              ? currentPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : "-"}
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
            {ticker
              ? parseFloat(ticker.highPrice)
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 저가</span>
          <span className="text-white text-xs">
            {ticker
              ? parseFloat(ticker.lowPrice)
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : "-"}
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
        {/* 로그인/잔고/닉네임 제거 - FutureClientLayout 상단 헤더로 이동 */}
      </div>

      {/* 모바일 - 시세 정보만 */}
      <div className="flex lg:hidden flex-col w-full gap-0.5">
        {/* 1행: 현재가 + 등락률 + 잔고 */}
        <div className="flex items-center gap-2">
          <span
            className={`font-bold text-base transition-colors ${priceUp ? "text-green-400" : "text-red-400"}`}
          >
            {currentPrice > 0 ? currentPrice.toLocaleString() : "-"}
          </span>
          <span
            className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}
          >
            {isPositive ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
          {isLoggedIn && userInfo && (
            <span className="ml-auto text-gray-500 text-[10px]">
              잔고{" "}
              <span className="text-white font-bold">
                {userInfo.wallet?.balance.toFixed(2)} USDT
              </span>
            </span>
          )}
        </div>
        {/* 2행: 고가/저가/거래량 */}
        <div className="flex items-center gap-3 text-[10px]">
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
        </div>
      </div>

      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
