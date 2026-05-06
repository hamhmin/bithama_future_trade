"use client";

import { TutorialStep } from "./tutorialSteps";

type Props = {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  position: { top: number; left: number };
  tooltipPosition: "top" | "bottom" | "left" | "right";
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  onPrev: () => void;
  errorMessage?: string;
};

export default function TutorialTooltip({
  step,
  currentStep,
  totalSteps,
  position,
  tooltipPosition,
  onNext,
  onSkip,
  isLastStep,
  onPrev,
  errorMessage,
}: Props) {
  return (
    <div
      className="fixed z-[200] w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-4 flex flex-col gap-3"
      style={{ top: position.top, left: position.left }}
    >
      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-blue-500" : "bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* 타이틀 */}
      <p className="text-white font-bold text-sm">{step.title}</p>

      {/* 설명 */}
      <p className="text-gray-400 text-xs leading-relaxed">
        {step.description}
      </p>
      {errorMessage && (
        <p className="text-red-400 text-xs bg-red-400/10 rounded p-2">
          ⚠️ {errorMessage}
        </p>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
        <button
          onClick={onSkip}
          className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
        >
          건너뛰기
        </button>

        <div className="flex items-center gap-2  ml-auto">
          {/* 이전 버튼 - 첫 번째 스텝이면 숨김 */}
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold transition-colors"
            >
              ← 이전
            </button>
          )}

          {step.trigger === "input" && (
            <button
              onClick={onNext}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              {isLastStep ? "완료! 🎉" : "다음 →"}
            </button>
          )}
          {step.trigger === "click" && (
            <span className="text-blue-400 text-xs animate-pulse">
              버튼을 클릭하면 넘어가요 →
            </span>
          )}
          {step.trigger === "submit" && (
            <span className="text-blue-400 text-xs animate-pulse">
              주문하면 자동으로 넘어가요 →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
