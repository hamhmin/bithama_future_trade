"use client";

import { useState } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import toast from "react-hot-toast";
import LoadingDots from "@/component/common/LoadingDots";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchPositions } from "@/lib/queries";

type Position = {
  id: number;
  side: string;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
};

type OrderType = "market" | "limit";

export default function CloseForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const currentPrice = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price) : 0,
  );
  const authStatus = useFutureStore((state) => state.authStatus);

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: QUERY_KEYS.positions,
    queryFn: fetchPositions,
    enabled: authStatus === "logged-in",
    staleTime: 0,
  });

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // positions 바뀌면 selectedPos 자동 동기화
  const currentSelectedPos = selectedPos
    ? (positions.find((p) => p.id === selectedPos.id) ?? positions[0] ?? null)
    : (positions[0] ?? null);

  // 예상 손익 계산
  const closePrice =
    orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const closeSize = parseFloat(size) || 0;
  const pnl =
    currentSelectedPos && closePrice && closeSize
      ? currentSelectedPos.side === "long"
        ? (closePrice - currentSelectedPos.entryPrice) * closeSize
        : (currentSelectedPos.entryPrice - closePrice) * closeSize
      : 0;

  const handlePercent = (percent: number) => {
    if (!currentSelectedPos) return;
    setSelectedPercent(percent);
    const newSize = (currentSelectedPos.size * percent) / 100;
    setSize(newSize.toFixed(4));
  };

  const handleSubmit = async () => {
    if (!currentSelectedPos) {
      setMessage("청산할 포지션을 선택해주세요.");
      return;
    }
    if (!size || parseFloat(size) <= 0) {
      setMessage("청산할 수량을 입력해주세요.");
      return;
    }
    if (orderType === "limit" && (!price || parseFloat(price) <= 0)) {
      setMessage("지정가를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/position/${currentSelectedPos.id}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            size: parseFloat(size),
            type: orderType,
            price: orderType === "limit" ? parseFloat(price) : undefined,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        setMessage(data.message);
      } else {
        toast.success(data.message);
        setSize("");
        setPrice("");
        setSelectedPercent(null);
        setSelectedPos(null);
        // 소켓 filled 이벤트가 invalidateAll 처리하므로 여기서 중복 호출 안 함
        onSuccess();
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        오픈 포지션이 없어요
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 포지션 선택 */}
      <div className="flex gap-2">
        {positions.map((pos) => (
          <button
            key={pos.id}
            onClick={() => {
              setSelectedPos(pos);
              setSize("");
              setSelectedPercent(null);
            }}
            className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${
              currentSelectedPos?.id === pos.id
                ? pos.side === "long"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
                : "bg-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {pos.side === "long" ? "Long" : "Short"} {pos.size} BTC
          </button>
        ))}
      </div>

      {/* 시장가 / 지정가 */}
      <div className="flex gap-2">
        {(["market", "limit"] as OrderType[]).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              orderType === t
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "market" ? "시장가" : "지정가"}
          </button>
        ))}
      </div>

      {/* 지정가 입력 */}
      {orderType === "limit" && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">청산가 (USDT)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={currentPrice.toFixed(2)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* 수량 입력 */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400">
          <label>청산 수량 (BTC)</label>
          {currentSelectedPos && (
            <span>보유: {currentSelectedPos.size} BTC</span>
          )}
        </div>
        <input
          type="number"
          value={size}
          onChange={(e) => {
            setSize(e.target.value);
            setSelectedPercent(null);
          }}
          placeholder="0.000"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* % 프리셋 */}
      <div className="flex gap-1">
        {[25, 50, 75, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => handlePercent(percent)}
            className={`flex-1 py-1 rounded text-xs transition-colors ${
              selectedPercent === percent
                ? "bg-blue-600 text-white"
                : "text-gray-400 bg-gray-800 hover:text-white hover:bg-gray-700"
            }`}
          >
            {percent === 100 ? "전체" : `${percent}%`}
          </button>
        ))}
      </div>

      {/* 예상 손익 */}
      {currentSelectedPos && closeSize > 0 && closePrice > 0 && (
        <div className="flex flex-col gap-1 bg-gray-800 rounded px-3 py-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>청산 수량</span>
            <span className="text-white">{closeSize} BTC</span>
          </div>
          <div className="flex justify-between">
            <span>예상 손익</span>
            <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(2)} USDT
            </span>
          </div>
        </div>
      )}

      {/* 메시지 */}
      {message && (
        <div
          className={`text-xs text-center py-1 rounded ${
            message.includes("완료") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* 청산 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading || !currentSelectedPos}
        className={`w-full py-3 rounded font-bold text-white transition-colors ${
          loading || !currentSelectedPos
            ? "bg-gray-600 cursor-not-allowed"
            : currentSelectedPos?.side === "long"
              ? "bg-green-600 hover:bg-green-500"
              : "bg-red-600 hover:bg-red-500"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <LoadingDots size="sm" color="white" />
          </div>
        ) : (
          "포지션 청산"
        )}
      </button>
    </div>
  );
}
