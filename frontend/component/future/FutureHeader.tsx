"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFutureStore } from "@/store/useFutureStore";

type TickerData = {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
};

type UserInfo = {
  nickname: string;
  wallet: {
    balance: number;
    locked: number;
  };
};

export default function FutureHeader() {
  const router = useRouter();
  const tradeData = useFutureStore((state) => state.tradeData);
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);

  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [prevPrice, setPrevPrice] = useState(0);
  const [priceUp, setPriceUp] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 24시간 티커 가져오기
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

  // 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      if (authStatus !== "logged-in") return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        setUserInfo(data);
      } catch {}
    };
    fetchUser();
  }, [authStatus]);

  // 현재가 등락 방향 감지
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
      setUserInfo(null);
      router.refresh();
    } catch {}
  };

  const changePercent = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="w-full h-full flex items-center justify-between px-4 text-sm">
      {/* 좌측 - 심볼 + 가격 정보 */}
      <div className="flex items-center gap-6">
        {/* 심볼 */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base">BTCUSDT</span>
          <span className="text-gray-500 text-xs">무기한</span>
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

        {/* 24H 고가 */}
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 고가</span>
          <span className="text-white text-xs">
            {ticker ? parseFloat(ticker.highPrice).toLocaleString() : "-"}
          </span>
        </div>

        {/* 24H 저가 */}
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">24H 저가</span>
          <span className="text-white text-xs">
            {ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "-"}
          </span>
        </div>

        {/* 24H 거래량 */}
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
      </div>

      {/* 우측 - 유저 정보 */}
      <div className="flex items-center gap-3">
        {authStatus === "logged-in" && userInfo ? (
          <>
            {/* 잔고 */}
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-xs">가용 잔고</span>
              <span className="text-white text-xs font-bold">
                {userInfo.wallet?.balance.toFixed(2)} USDT
              </span>
            </div>

            <div className="w-px h-8 bg-gray-700" />

            {/* 닉네임 */}
            <span className="text-gray-300 text-sm">{userInfo.nickname}</span>

            {/* 로그아웃 버튼 */}
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
              onClick={() => router.push("/login")}
              className="px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              로그인
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              회원가입
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
