"use client";

type MarginType = "isolated" | "cross";

export default function MarginLeverageBar({
  marginType,
  leverage,
  marginTypeLocked,
  fetchLoading,
  onMarginClick,
  onLeverageClick,
}: {
  marginType: MarginType;
  leverage: number;
  marginTypeLocked: boolean;
  fetchLoading: boolean;
  onMarginClick: () => void;
  onLeverageClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (marginTypeLocked) return;
          onMarginClick();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
          marginTypeLocked
            ? "border-gray-700 text-gray-500 cursor-not-allowed"
            : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
        }`}
      >
        {marginType === "isolated" ? "Isolated" : "Cross"}
        {!marginTypeLocked && <span className="text-gray-500">▾</span>}
      </button>

      {/* 레버리지 버튼 */}
      <button
        onClick={() => {
          if (fetchLoading) return; // ← fetchLoading만 체크
          onLeverageClick();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
          fetchLoading
            ? "border-gray-700 text-gray-500 cursor-not-allowed"
            : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white cursor-pointer"
        }`}
      >
        {leverage}x{!fetchLoading && <span className="text-gray-500">▾</span>}
      </button>

      {marginTypeLocked && (
        <span className="text-yellow-400 text-xs">
          포지션 청산 후 변경 가능
        </span>
      )}
    </div>
  );
}
