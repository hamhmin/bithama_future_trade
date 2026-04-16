"use client";

import { useFutureStore } from "@/store/useFutureStore";
import { useEffect, useState } from "react";

type FundingHistory = {
  id: number;
  positionId: number;
  amount: number;
  rate: number;
  createdAt: string;
  position: {
    side: string;
    symbol: string;
  };
};

export default function TransactionHistoryTab() {
  const [history, setHistory] = useState<FundingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const shouldRefresh = useFutureStore((state) => state.shouldRefresh);

  useEffect(() => {
    if (!shouldRefresh) return;
    fetchHistory();
  }, [shouldRefresh]);
  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/funding/history`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      setHistory(await res.json());
    } catch {
      console.error("펀딩비 내역 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        펀딩비 내역이 없어요
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-700">
          <th className="px-3 py-2 text-left">심볼</th>
          <th className="px-3 py-2 text-left">방향</th>
          <th className="px-3 py-2 text-right">펀딩비율</th>
          <th className="px-3 py-2 text-right">금액</th>
          <th className="px-3 py-2 text-right">일시</th>
        </tr>
      </thead>
      <tbody>
        {history.map((item) => {
          const isPositive = item.amount >= 0;
          return (
            <tr
              key={item.id}
              className="border-b border-gray-800 hover:bg-gray-800"
            >
              <td className="px-3 py-2 text-white">{item.position.symbol}</td>
              <td className="px-3 py-2">
                <span
                  className={`font-bold ${
                    item.position.side === "long"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {item.position.side === "long" ? "Long" : "Short"}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-400">
                {(item.rate * 100).toFixed(4)}%
              </td>
              <td
                className={`px-3 py-2 text-right font-bold ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {item.amount.toFixed(4)} USDT
              </td>
              <td className="px-3 py-2 text-right text-gray-400">
                {new Date(item.createdAt).toLocaleString("ko-KR")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
