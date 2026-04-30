"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "../common/GuestModal";
import Link from "next/link";

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

export default function FutureHeader({ initialTrade }: { initialTrade: any }) {
  const router = useRouter();
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const tradeFromSocket = useFutureStore((state) => state.tradeData);

  const tradeData = tradeFromSocket ? tradeFromSocket : initialTrade;

  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [prevPrice, setPrevPrice] = useState(0);
  const [priceUp, setPriceUp] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"select" | "login" | "register">(
    "select",
  );
  const shouldRefresh = useFutureStore((state) => state.shouldRefresh);

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
  const fetchUser = useCallback(async () => {
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
  }, [authStatus]);

  // 유저 정보 가져오기
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  // shouldRefresh 감지 시 유저 정보 갱신
  useEffect(() => {
    if (!shouldRefresh) return;
    fetchUser();
  }, [shouldRefresh]);
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
      {/* ───── 데스크탑 레이아웃 (lg 이상) ───── */}
      <div className="hidden lg:flex items-center gap-6 w-full">
        {/* 심볼 */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base">BTCUSDT</span>
          <span className="text-gray-500 text-xs">무기한</span>
        </div>
        {/* 현재가 */}
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
        {/* 우측 */}
        <div className="ml-auto flex items-center gap-3">
          {authStatus === "logged-in" && userInfo ? (
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

      {/* ───── 모바일 레이아웃 (lg 미만) ───── */}
      <div className="flex lg:hidden flex-col w-full py-1 gap-0.5">
        {/* 1행: 심볼 + 현재가 + 등락률 + 우측버튼 */}
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

          {/* 우측 버튼 */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {authStatus === "logged-in" && userInfo ? (
              <button
                onClick={handleLogout}
                className="px-2 py-0.5 rounded text-[10px] text-gray-400 border border-gray-700"
              >
                로그아웃
              </button>
            ) : authStatus === "guest" ? (
              <>
                <button
                  onClick={() => {
                    setModalMode("login");
                    setShowModal(true);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] text-white bg-blue-600"
                >
                  로그인
                </button>
                {/* <button
                  onClick={() => {
                    setShowModal(true);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] text-gray-300 border border-gray-700"
                >
                  회원가입
                </button> */}
              </>
            ) : null}
          </div>
        </div>

        {/* 2행: BTCUSDT + 고가 / 저가 / 거래량 / 잔고 */}
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
          {authStatus === "logged-in" && userInfo && (
            <span className="ml-auto text-gray-500">
              잔고{" "}
              <span className="text-white font-bold">
                {userInfo.wallet?.balance.toFixed(2)} USDT
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <GuestModal
          onClose={() => setShowModal(false)}
          // initialMode={modalMode}
        />
      )}
    </div>
  );
}
