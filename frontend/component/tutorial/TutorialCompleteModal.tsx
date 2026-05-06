"use client";
import { useRef, useEffect, useState } from "react";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  onConfirm: () => void;
  targetRect?: Rect | null;
};

export default function TutorialCompleteModal({
  onConfirm,
  targetRect,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState(280);

  useEffect(() => {
    if (modalRef.current) {
      setModalHeight(modalRef.current.offsetHeight);
    }
  }, []);
  const style = targetRect
    ? {
        position: "fixed" as const,
        top: targetRect.top - modalHeight - 16, // 실제 모달 높이 기준
        left: Math.max(
          8,
          Math.min(
            window.innerWidth - 328,
            targetRect.left + targetRect.width / 2 - 160,
          ),
        ),
        zIndex: 300,
      }
    : {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 300,
      };

  return (
    <div
      ref={modalRef}
      style={style}
      className="w-80 bg-gray-800 border border-gray-600 rounded-xl p-6 flex flex-col gap-4 items-center text-center shadow-2xl"
    >
      {/* 이모지 */}
      <div className="text-5xl animate-bounce">🎉</div>

      {/* 타이틀 */}
      <div className="flex flex-col gap-1">
        <p className="text-white font-bold text-lg">첫 거래 완료!</p>
        <p className="text-gray-400 text-sm">
          아래 포지션탭에서 포지션을 확인하고 청산해보세요!
        </p>
      </div>

      {/* 안내 */}
      <div className="bg-gray-700/50 rounded-lg p-3 flex flex-col gap-2 w-full text-left">
        <p className="text-gray-300 text-xs font-bold">
          📋 여기서 거래 내역을 확인하세요
        </p>
        <div className="flex flex-col gap-1.5 text-xs text-gray-400">
          <p>
            • <span className="text-white">TP/SL</span> → 목표가/손절가 설정
          </p>
          <p>
            • <span className="text-white">증거금 추가</span> → 청산가 조정을
            위한 추가 증거금
          </p>
          <p>
            • <span className="text-white">공유</span> → 포지션 카드 공유하기
          </p>
          <p>
            • <span className="text-white">청산</span> → 포지션 종료 및 손익
            확정
          </p>
        </div>
      </div>

      {/* 확인 버튼 */}
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
      >
        거래 시작하기 🚀
      </button>
    </div>
  );
}
