"use client";

import { useState } from "react";
import { useFutureStore } from "@/store/useFutureStore";

type OrderType = "market" | "limit";
type Side = "long" | "short";

export default function OrderPanel() {
  const tradeData = useFutureStore((state) => state.tradeData);
  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;

  const [side, setSide] = useState<Side>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 증거금 계산
  const executionPrice = orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const margin = executionPrice && parseFloat(size)
    ? (executionPrice * parseFloat(size)) / leverage
    : 0;

  const handleSubmit = async () => {
    if (!size || parseFloat(size) <= 0) {
      setMessage("수량을 입력해주세요.");
      return;
    }
    if (orderType === "limit" && (!price || parseFloat(price) <= 0)) {
      setMessage("지정가를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:4000/api/future/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 쿠키 자동 포함
        body: JSON.stringify({
          side,
          type: orderType,
          price: orderType === "limit" ? parseFloat(price) : undefined,
          size: parseFloat(size),
          leverage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "주문 실패");
      } else {
        setMessage(data.message ?? "주문 완료!");
        setSize("");
        setPrice("");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 gap-3 text-sm">

      {/* Long / Short 탭 */}
      <div className="flex rounded overflow-hidden border border-gray-700">
        <button
          onClick={() => setSide("long")}
          className={`flex-1 py-2 font-bold transition-colors ${
            side === "long"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide("short")}
          className={`flex-1 py-2 font-bold transition-colors ${
            side === "short"
              ? "bg-red-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Short
        </button>
      </div>

      {/* 시장가 / 지정가 탭 */}
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

      {/* 레버리지 */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-gray-400 text-xs">
          <span>레버리지</span>
          <span className="text-white font-bold">{leverage}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-gray-600 text-xs">
          <span>1x</span>
          <span>25x</span>
          <span>50x</span>
          <span>75x</span>
          <span>100x</span>
        </div>
      </div>

      {/* 지정가 입력 */}
      {orderType === "limit" && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">주문가 (USDT)</label>
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
        <label className="text-gray-400 text-xs">수량 (BTC)</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="0.000"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 증거금 표시 */}
      <div className="flex justify-between text-xs text-gray-400 bg-gray-800 rounded px-3 py-2">
        <span>증거금</span>
        <span className="text-white">
          {margin > 0 ? `${margin.toFixed(2)} USDT` : "-"}
        </span>
      </div>

      {/* 현재가 표시 */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>현재가</span>
        <span className="text-white">
          {currentPrice > 0 ? `$${currentPrice.toLocaleString()}` : "-"}
        </span>
      </div>

      {/* 에러/성공 메시지 */}
      {message && (
        <div className={`text-xs text-center py-1 rounded ${
          message.includes("완료") || message.includes("!")
            ? "text-green-400"
            : "text-red-400"
        }`}>
          {message}
        </div>
      )}

      {/* 주문 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded font-bold text-white transition-colors ${
          loading
            ? "bg-gray-600 cursor-not-allowed"
            : side === "long"
            ? "bg-green-600 hover:bg-green-500"
            : "bg-red-600 hover:bg-red-500"
        }`}
      >
        {loading ? "처리중..." : side === "long" ? "Long 주문" : "Short 주문"}
      </button>
    </div>
  );
}