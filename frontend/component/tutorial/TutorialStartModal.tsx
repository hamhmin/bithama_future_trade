"use client";

type Props = {
  onStart: () => void;
  onSkip: () => void;
};

export default function TutorialStartModal({ onStart, onSkip }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300]">
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-80 flex flex-col gap-4 items-center text-center shadow-2xl">
        {/* 이모지 */}
        <div className="text-5xl">👋</div>

        {/* 타이틀 */}
        <div className="flex flex-col gap-1">
          <p className="text-white font-bold text-lg">
            BITHAMA에 오신 걸 환영해요!
          </p>
          <p className="text-gray-400 text-sm">
            처음이시라면 간단한 튜토리얼을 통해 선물거래를 체험해보세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onStart}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
          >
            튜토리얼 시작하기 🚀
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
