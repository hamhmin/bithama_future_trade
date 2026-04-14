"use client";

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
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-64 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-sm">레버리지 설정</h3>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>레버리지</span>
            <span className="text-white font-bold">{leverage}x</span>
          </div>
          <input
            type="range"
            min={minLeverage}
            max={100}
            value={leverage < minLeverage ? minLeverage : leverage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val < minLeverage) return;
              onChange(val);
            }}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-gray-600 text-xs">
            <span>{minLeverage}x</span>
            <span>25x</span>
            <span>50x</span>
            <span>75x</span>
            <span>100x</span>
          </div>
          {openPosition?.marginType === "isolated" && (
            <p className="text-yellow-400 text-xs">
              Isolated 포지션 보유 중 → {openPosition.leverage}x 이상만 가능해요
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 rounded text-white bg-blue-600 hover:bg-blue-500 text-sm font-bold"
        >
          확인
        </button>
      </div>
    </div>
  );
}
