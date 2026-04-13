"use client";

import { useFutureStore } from "@/store/useFutureStore";
import { useEffect, useState } from "react";

type FundingData = {
  lastFundingRate: string;
  nextFundingTime: number;
};

export default function TradeInfo() {
  const tradeData = useFutureStore((state) => state.tradeData);
  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;
  const [funding, setFunding] = useState<FundingData | null>(null);
  const [countdown, setCountdown] = useState("");
  const [wallet, setWallet] = useState<{ balance: number; locked: number } | null>(null);

  // 펀딩비 데이터 가져오기
  useEffect(() => {
    const fetchFunding = async () => {
      try {
        const res = await fetch(
          "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"
        );
        const data = await res.json();
        setFunding({
          lastFundingRate: data.lastFundingRate,
          nextFundingTime: data.nextFundingTime,
        });
      } catch {
        console.error("펀딩비 로딩 실패");
      }
    };

    fetchFunding();
    const interval = setInterval(fetchFunding, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 펀딩비 카운트다운
  useEffect(() => {
    if (!funding) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = funding.nextFundingTime - now;

      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [funding]);

  // 내 지갑 정보 가져오기
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setWallet(data.wallet);
      } catch {
        console.error("지갑 로딩 실패");
      }
    };

    fetchWallet();
    const interval = setInterval(fetchWallet, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const fundingRate = funding
    ? (parseFloat(funding.lastFundingRate) * 100).toFixed(4)
    : "-";
  const isFundingPositive = funding
    ? parseFloat(funding.lastFundingRate) >= 0
    : true;

  return (
    <div className="w-full h-full flex flex-col gap-3 p-3 text-xs">

      {/* 내 자산 */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
        <span className="text-gray-400 font-bold">내 자산</span>
        <div className="flex justify-between">
          <span className="text-gray-400">가용 잔고</span>
          <span className="text-white font-bold">
            {wallet ? `${wallet.balance.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">증거금</span>
          <span className="text-white">
            {wallet ? `${wallet.locked.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">총 자산</span>
          <span className="text-white">
            {wallet
              ? `${(wallet.balance + wallet.locked).toFixed(2)} USDT`
              : "-"}
          </span>
        </div>
      </div>

      {/* 펀딩비 */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
        <span className="text-gray-400 font-bold">펀딩비</span>
        <div className="flex justify-between">
          <span className="text-gray-400">현재 펀딩비율</span>
          <span
            className={`font-bold ${
              isFundingPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isFundingPositive ? "+" : ""}
            {fundingRate}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">다음 펀딩까지</span>
          <span className="text-white">{countdown || "-"}</span>
        </div>
      </div>

      {/* 시장 정보 */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
        <span className="text-gray-400 font-bold">시장 정보</span>
        <div className="flex justify-between">
          <span className="text-gray-400">현재가</span>
          <span className="text-white">
            {currentPrice > 0 ? `$${currentPrice.toLocaleString()}` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">심볼</span>
          <span className="text-white">BTCUSDT 무기한</span>
        </div>
      </div>
    </div>
  );
}