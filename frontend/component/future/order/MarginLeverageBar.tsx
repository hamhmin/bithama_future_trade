"use client";

import LoadingDots from "@/component/common/LoadingDots";

type MarginType = "isolated" | "cross";

export default function MarginLeverageBar({
  marginType,
  leverage,
  marginTypeLocked,
  fetchLoading,
  isGuest,
  hasSidePosition,
  onMarginClick,
  onLeverageClick,
}: {
  marginType: MarginType;
  leverage: number;
  marginTypeLocked: boolean;
  fetchLoading: boolean;
  isGuest: boolean;
  hasSidePosition: boolean;
  onMarginClick: () => void;
  onLeverageClick: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        {/* 마진타입 버튼 */}
        <button
          onClick={() => {
            if (fetchLoading) return;
            if (marginTypeLocked && !isGuest) return;
            onMarginClick();
          }}
          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer min-w-[64px] h-6 ${
            fetchLoading || (marginTypeLocked && !isGuest)
              ? "border-gray-700 text-gray-500 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
          }`}
        >
          {fetchLoading ? (
            <LoadingDots size="xs" />
          ) : (
            <>
              {marginType === "isolated" ? "Isolated" : "Cross"}
              {!(marginTypeLocked && !isGuest) && (
                <span className="text-gray-500">▾</span>
              )}
            </>
          )}
        </button>

        {/* 레버리지 버튼 */}
        <button
          onClick={() => {
            if (fetchLoading) return;
            onLeverageClick();
          }}
          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer min-w-[48px] h-6 ${
            fetchLoading
              ? "border-gray-700 text-gray-500 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
          }`}
        >
          {fetchLoading ? (
            <LoadingDots size="xs" />
          ) : (
            <>
              {leverage}x<span className="text-gray-500">▾</span>
            </>
          )}
        </button>
      </div>

      {/* 잠금 안내 */}
      {!fetchLoading && marginTypeLocked && !isGuest && hasSidePosition && (
        <span className="text-yellow-400 text-xs">
          마진타입은 포지션 청산 후 변경 가능해요
        </span>
      )}
    </>
  );
}
