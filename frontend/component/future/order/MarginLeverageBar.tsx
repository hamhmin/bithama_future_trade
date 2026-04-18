"use client";

type MarginType = "isolated" | "cross";

export default function MarginLeverageBar({
  marginType,
  leverage,
  marginTypeLocked,
  fetchLoading,
  isGuest,
  onMarginClick,
  onLeverageClick,
}: {
  marginType: MarginType;
  leverage: number;
  marginTypeLocked: boolean;
  fetchLoading: boolean;
  isGuest: boolean;
  onMarginClick: () => void;
  onLeverageClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* 마진타입 버튼 */}
      <button
        onClick={() => {
          if (fetchLoading) return;
          if (marginTypeLocked && !isGuest) return;
          onMarginClick();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
          fetchLoading || (marginTypeLocked && !isGuest)
            ? "border-gray-700 text-gray-500 cursor-not-allowed"
            : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
        }`}
      >
        {marginType === "isolated" ? "Isolated" : "Cross"}
        {!fetchLoading && !(marginTypeLocked && !isGuest) && (
          <span className="text-gray-500">▾</span>
        )}
      </button>

      {/* 레버리지 버튼 */}
      <button
        onClick={() => {
          if (fetchLoading) return;
          onLeverageClick();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
          fetchLoading
            ? "border-gray-700 text-gray-500 cursor-not-allowed"
            : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
        }`}
      >
        {leverage}x{!fetchLoading && <span className="text-gray-500">▾</span>}
      </button>

      {/* 잠금 안내 - 비로그인이면 표시 안 함 */}
      {marginTypeLocked && !isGuest && (
        <span className="text-yellow-400 text-xs">
          포지션 청산 후 변경 가능!
        </span>
      )}
    </div>
  );
}
