"use client";

type MarginType = "isolated" | "cross";

export default function MarginModal({
  marginType,
  onClose,
  onChange,
}: {
  marginType: MarginType;
  onClose: () => void;
  onChange: (type: MarginType) => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-64 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-sm">마진 타입</h3>
        <div className="flex flex-col gap-2">
          {(["isolated", "cross"] as MarginType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                onChange(type);
                onClose();
              }}
              className={`py-2 rounded text-sm font-bold transition-colors ${
                marginType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {type === "isolated" ? "Isolated" : "Cross"}
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-xs text-center">
          {marginType === "isolated"
            ? "포지션마다 증거금이 분리돼요"
            : "지갑 전체가 증거금으로 사용돼요"}
        </p>
      </div>
    </div>
  );
}
