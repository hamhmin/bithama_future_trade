"use client";

import { useEffect, useState, RefObject, startTransition } from "react";
import TutorialTooltip from "./TutorialTooltip";
import TutorialCompleteModal from "./TutorialCompleteModal";
import { TutorialStep } from "./tutorialSteps";
import { useIsDesktop } from "@/hooks/useIsDesktop";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  isActive: boolean;
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  refs: Record<string, RefObject<HTMLElement | null>>;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  errorMessage?: string;
  showCompleteModal?: boolean;
  onConfirm?: () => void;
};

const PADDING = 8;

export default function TutorialOverlay({
  isActive,
  step,
  currentStep,
  totalSteps,
  refs,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
  errorMessage,
  showCompleteModal,
  onConfirm,
}: Props) {
  const isDesktop = useIsDesktop();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!isActive) return;

    startTransition(() => {
      setTargetRect(null); // 스텝 바뀌면 즉시 초기화
    });

    const updateRect = () => {
      const ref = refs[step.targetRef];
      if (!ref?.current) return;
      const rect = ref.current.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    // 즉시 실행 + requestAnimationFrame으로 DOM 렌더 후 재실행
    updateRect();
    const raf = requestAnimationFrame(updateRect);

    window.addEventListener("resize", updateRect);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateRect);
    };
  }, [isActive, step.targetRef, refs]);

  if (!isActive || !targetRect) return null;

  const spotlight = {
    top: Math.max(0, targetRect.top - PADDING),
    left: Math.max(0, targetRect.left - PADDING),
    width: targetRect.width + PADDING * 2,
    height: targetRect.height + PADDING * 2,
  };

  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 16;
    const screenPadding = 8;

    let top = 0;
    let left = 0;

    if (!isDesktop) {
      const spaceBelow =
        window.innerHeight - targetRect.top - targetRect.height;
      if (spaceBelow > tooltipHeight + margin) {
        top = targetRect.top + targetRect.height + margin;
      } else {
        top = targetRect.top - tooltipHeight - margin;
      }
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else {
      switch (step.tooltipPosition) {
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.left + targetRect.width + margin;
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.left - tooltipWidth - margin;
          break;
        case "bottom":
          top = targetRect.top + targetRect.height + margin;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          break;
        case "top":
        default:
          top = targetRect.top - tooltipHeight - margin;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          break;
      }
    }

    left = Math.max(
      screenPadding,
      Math.min(window.innerWidth - tooltipWidth - screenPadding, left),
    );
    top = Math.max(
      screenPadding,
      Math.min(window.innerHeight - tooltipHeight - screenPadding, top),
    );

    return { top, left };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <>
      {/* 어두운 오버레이 4분할 */}
      <div className="fixed inset-0 z-[150] pointer-events-none">
        {/* 위 */}
        <div
          className="absolute bg-black/70 cursor-not-allowed pointer-events-auto"
          style={{ top: 0, left: 0, right: 0, height: spotlight.top }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* 아래 */}
        <div
          className="absolute bg-black/70 cursor-not-allowed pointer-events-auto"
          style={{
            top: spotlight.top + spotlight.height,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* 왼쪽 */}
        <div
          className="absolute bg-black/70 cursor-not-allowed pointer-events-auto"
          style={{
            top: spotlight.top,
            left: 0,
            width: spotlight.left,
            height: spotlight.height,
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* 오른쪽 */}
        <div
          className="absolute bg-black/70 cursor-not-allowed pointer-events-auto"
          style={{
            top: spotlight.top,
            left: spotlight.left + spotlight.width,
            right: 0,
            height: spotlight.height,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* spotlight 테두리 하이라이트 */}
      <div
        className="fixed z-[151] rounded-lg pointer-events-none"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          boxShadow: "0 0 0 2px #3b82f6",
          animation: "pulse 2s infinite",
          transition: "all 0.3s ease-out",
        }}
      />

      {/* spotlight 클릭 감지 - complete 스텝에서만 모달 닫기 */}
      {step.trigger === "complete" && (
        <div
          className="fixed z-[152] cursor-pointer"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          onClick={onConfirm}
        />
      )}
      {/* 말풍선 - complete 스텝이면 숨김 */}
      {step.trigger !== "complete" && (
        <TutorialTooltip
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          position={tooltipPos}
          tooltipPosition={isDesktop ? step.tooltipPosition : "bottom"}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          isLastStep={isLastStep}
          errorMessage={errorMessage}
        />
      )}

      {/* 완료 모달 - complete 스텝에서 표시 */}
      {step.trigger === "complete" && showCompleteModal && onConfirm && (
        <TutorialCompleteModal onConfirm={onConfirm} targetRect={targetRect} />
      )}
    </>
  );
}
