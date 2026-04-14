"use client";

type OrderType = "market" | "limit";
type Side = "long" | "short";
type AuthStatus = "loading" | "guest" | "logged-in";

export default function OrderForm({
  side,
  orderType,
  price,
  size,
  currentPrice,
  margin,
  previewLiqPrice,
  wallet,
  executionPrice,
  leverage,
  message,
  loading,
  authStatus,
  onPriceChange,
  onSizeChange,
  onSubmit,
  onLoginClick,
}: {
  side: Side;
  orderType: OrderType;
  price: string;
  size: string;
  currentPrice: number;
  margin: number;
  previewLiqPrice: number;
  wallet: { balance: number; locked: number } | null;
  executionPrice: number;
  leverage: number;
  message: string;
  loading: boolean;
  authStatus: AuthStatus;
  onPriceChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onSubmit: () => void;
  onLoginClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* 지정가 입력 */}
      {orderType === "limit" && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">주문가 (USDT)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
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
          onChange={(e) => onSizeChange(e.target.value)}
          placeholder="0.000"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 25/50/75/100% 프리셋 */}
      <div className="flex gap-1">
        {[25, 50, 75, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => {
              if (!wallet || !executionPrice) return;
              const maxSize = (wallet.balance * leverage) / executionPrice;
              const newSize = (maxSize * percent) / 100;
              onSizeChange(newSize.toFixed(4));
            }}
            className="flex-1 py-1 rounded text-xs text-gray-400 bg-gray-800 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {percent}%
          </button>
        ))}
      </div>

      {/* 가용 잔고 + 증거금 + 예상 청산가 */}
      <div className="flex flex-col gap-1 bg-gray-800 rounded px-3 py-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>가용 잔고</span>
          <span className="text-white">
            {wallet ? `${wallet.balance.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>증거금</span>
          <span className="text-white">
            {margin > 0 ? `${margin.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>예상 청산가</span>
          <span className="text-orange-400">
            {previewLiqPrice > 0 ? `$${previewLiqPrice.toLocaleString()}` : "-"}
          </span>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`text-xs text-center py-1 rounded ${
            message.includes("완료") || message.includes("!")
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* 주문 버튼 or 로그인 유도 */}
      {authStatus === "guest" ? (
        <button
          onClick={onLoginClick}
          className="w-full py-3 rounded font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          로그인 후 주문하기
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={loading || authStatus === "loading"}
          className={`w-full py-3 rounded font-bold text-white transition-colors ${
            loading || authStatus === "loading"
              ? "bg-gray-600 cursor-not-allowed"
              : side === "long"
                ? "bg-green-600 hover:bg-green-500"
                : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {loading ? "처리중..." : side === "long" ? "Long 주문" : "Short 주문"}
        </button>
      )}
    </div>
  );
}
