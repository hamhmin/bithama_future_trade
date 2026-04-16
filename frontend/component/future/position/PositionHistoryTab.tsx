"use client";

import { useEffect, useState } from "react";

type ClosedPosition = {
  id: number;
  side: string;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  marginType: string;
  status: string;
  pnl: number;
  createdAt: string;
  updatedAt: string;
};

export default function PositionHistoryTab() {
  const [positions, setPositions] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/positions/history`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      setPositions(await res.json());
    } catch {
      console.error("포지션 히스토리 로딩 실패");
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

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        청산된 포지션이 없어요
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-700">
          <th className="px-3 py-2 text-left">심볼</th>
          <th className="px-3 py-2 text-left">방향</th>
          <th className="px-3 py-2 text-right">수량</th>
          <th className="px-3 py-2 text-right">진입가</th>
          <th className="px-3 py-2 text-right">증거금</th>
          <th className="px-3 py-2 text-right">실현 손익</th>
          <th className="px-3 py-2 text-center">상태</th>
          <th className="px-3 py-2 text-right">일시</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((pos) => {
          const isPnlPositive = pos.pnl >= 0;
          return (
            <tr
              key={pos.id}
              className="border-b border-gray-800 hover:bg-gray-800"
            >
              <td className="px-3 py-2 text-white">BTCUSDT</td>
              <td className="px-3 py-2">
                <div className="flex flex-col">
                  <span
                    className={`font-bold ${
                      pos.side === "long" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {pos.side === "long" ? "Long" : "Short"}
                  </span>
                  <span className="text-gray-500">
                    {pos.leverage}x{" "}
                    {pos.marginType === "cross" ? "Cross" : "Iso"}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-right text-white">
                {pos.size} BTC
              </td>
              <td className="px-3 py-2 text-right text-white">
                ${pos.entryPrice.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right text-white">
                ${pos.margin.toFixed(2)}
              </td>
              <td
                className={`px-3 py-2 text-right font-bold ${
                  isPnlPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPnlPositive ? "+" : ""}
                {pos.pnl.toFixed(2)} USDT
              </td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    pos.status === "liquidated"
                      ? "bg-red-900 text-red-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {pos.status === "liquidated" ? "강제청산" : "청산"}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-400">
                {new Date(pos.updatedAt).toLocaleString("ko-KR")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
