"use client";

import { useState } from "react";

export default function LeverageModal({
  leverage,
  minLeverage,
  openPosition,
  onClose,
  onChange,
}: {
  leverage: number;
  minLeverage: number;
  openPosition: { leverage: number; marginType: string } | null;
  onClose: () => void;
  onChange: (v: number) => void;
}) {
  // 1. 내부에서 관리할 임시 레버리지 상태 추가
  const [tempLeverage, setTempLeverage] = useState(leverage);
  const QUICK_VALUES = [25, 50, 75, 100];

  const calculateProgress = () => {
    const min = minLeverage;
    const max = 100;
    return ((tempLeverage - min) / (max - min)) * 100;
  };

  // 2. 확인 버튼 클릭 시 실행될 핸들러
  const handleConfirm = () => {
    onChange(tempLeverage); // 부모 상태 업데이트
    onClose(); // 모달 닫기
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-sm">레버리지 설정</h3>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end text-xs">
            <span className="text-gray-400">레버리지</span>
            <span className="text-blue-400 font-bold text-xl">
              {tempLeverage}x
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <input
              type="range"
              min={minLeverage}
              max={100}
              value={tempLeverage}
              // 실시간으로 로컬 상태만 변경
              onChange={(e) => setTempLeverage(parseInt(e.target.value))}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${calculateProgress()}%, #374151 ${calculateProgress()}%, #374151 100%)`,
              }}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-medium">
              <span>{minLeverage}x</span>
              <span>100x</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {QUICK_VALUES.map((val) => {
              const isDisabled = val < minLeverage;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={isDisabled}
                  // 퀵 버튼 클릭 시 로컬 상태만 변경
                  onClick={() => setTempLeverage(val)}
                  className={`py-1 text-[11px] rounded font-medium transition-colors ${
                    isDisabled
                      ? "bg-gray-900 text-gray-700 cursor-not-allowed"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                >
                  {val}x
                </button>
              );
            })}
          </div>

          {openPosition?.marginType === "isolated" && (
            <div className="bg-yellow-400/10 p-2 rounded border border-yellow-400/20">
              <p className="text-yellow-500 text-[11px] leading-relaxed">
                ⚠️ Isolated 포지션 보유 중 ({openPosition.leverage}x 이상 가능)
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm} // 수정된 핸들러 연결
          className="w-full py-2.5 rounded text-white bg-blue-600 hover:bg-blue-500 text-sm font-bold transition-colors shadow-lg"
        >
          확인
        </button>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}
