"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchAssets } from "@/lib/queries";

type Assets = {
  balance: number;
  locked: number;
  totalBalance: number;
  unrealizedPnl: number;
  totalEquity: number;
  marginRatio: number;
};

export default function AssetsTab() {
  const { data: assets, isLoading } = useQuery<Assets>({
    queryKey: QUERY_KEYS.assets,
    queryFn: fetchAssets,
    staleTime: 0,
  });

  if (isLoading || !assets) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPnlPositive = assets.unrealizedPnl >= 0;

  return (
    <div className="p-4 flex flex-col gap-4 text-xs">
      {/* 총 자산 */}
      <div className="bg-gray-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">총 자산</span>
          <span className="text-white font-bold text-base">
            {assets.totalEquity.toFixed(2)} USDT
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(assets.marginRatio, 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-gray-500">
          <span>증거금 비율</span>
          <span
            className={
              assets.marginRatio > 80 ? "text-red-400" : "text-gray-400"
            }
          >
            {assets.marginRatio.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 잔고 상세 */}
      <div className="bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
        <span className="text-gray-400 font-bold mb-1">잔고</span>
        <div className="flex justify-between">
          <span className="text-gray-500">가용 잔고</span>
          <span className="text-white">{assets.balance.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">사용 중 증거금</span>
          <span className="text-white">{assets.locked.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">총 잔고</span>
          <span className="text-white">
            {assets.totalBalance.toFixed(2)} USDT
          </span>
        </div>
      </div>

      {/* 손익 */}
      <div className="bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
        <span className="text-gray-400 font-bold mb-1">손익</span>
        <div className="flex justify-between">
          <span className="text-gray-500">미실현 손익</span>
          <span className={isPnlPositive ? "text-green-400" : "text-red-400"}>
            {isPnlPositive ? "+" : ""}
            {assets.unrealizedPnl.toFixed(2)} USDT
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">총 자산 (증거금 포함)</span>
          <span className="text-white">
            {assets.totalEquity.toFixed(2)} USDT
          </span>
        </div>
      </div>
    </div>
  );
}
