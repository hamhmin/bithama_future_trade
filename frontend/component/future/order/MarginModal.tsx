"use client";

import { useState } from "react";
import { useI18n } from "@/component/common/I18nProvider";

type MarginType = "isolated" | "cross";

const MARGIN_INFO = {
  isolated: {
    title: "Isolated (격리 마진)",
    description:
      "포지션에 설정한 증거금만 사용해요. 청산되어도 해당 증거금만 잃고 나머지 잔고는 안전해요.",
    pros: ["리스크 제한적", "잔고 보호"],
    color: "blue",
  },
  cross: {
    title: "Cross (교차 마진)",
    description:
      "지갑 전체 잔고가 증거금으로 사용돼요. 청산 위기 시 잔고 전체로 버티지만, 청산되면 전체를 잃을 수 있어요.",
    pros: ["청산가 유연", "포지션 유지에 유리"],
    color: "orange",
  },
};

export default function MarginModal({
  marginType,
  onClose,
  onChange,
}: {
  marginType: MarginType;
  onClose: () => void;
  onChange: (type: MarginType) => void;
}) {
  const { translate } = useI18n();
  const [selected, setSelected] = useState<MarginType>(marginType);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-5 w-72 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-sm">
          {translate("마진 타입 선택")}
        </h3>

        {/* 선택 버튼 */}
        <div className="flex flex-col gap-2">
          {(["isolated", "cross"] as MarginType[]).map((type) => {
            const info = MARGIN_INFO[type];
            const isSelected = selected === type;
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={`flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? type === "isolated"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-orange-500 bg-orange-500/10"
                    : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${isSelected ? (type === "isolated" ? "text-blue-400" : "text-orange-400") : "text-gray-300"}`}
                  >
                    {type === "isolated" ? "Isolated" : "Cross"}
                  </span>
                  {isSelected && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${type === "isolated" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}
                    >
                      {translate("선택됨")}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {translate(info.description)}
                </p>
                <div className="flex gap-1 mt-0.5">
                  {info.pros.map((pro) => (
                    <span
                      key={pro}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600 text-gray-300"
                    >
                      {translate(pro)}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* 경고 문구 */}
        <p className="text-yellow-500/80 text-[10px] leading-relaxed bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
          ⚠️ {translate("마진 타입은 포지션이 없을 때만 변경할 수 있어요.")}
        </p>

        {/* 확인 버튼 */}
        <button
          onClick={() => {
            onChange(selected);
            onClose();
          }}
          className="w-full py-2.5 rounded text-white bg-blue-600 hover:bg-blue-500 text-sm font-bold transition-colors"
        >
          {translate("확인")}
        </button>
      </div>
    </div>
  );
}
