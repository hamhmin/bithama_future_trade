"use client";

import { useRef } from "react";
import domtoimage from "dom-to-image";

type ShareCardProps = {
  position: {
    side: string;
    leverage: number;
    entryPrice: number;
    size: number;
    margin: number;
    marginType: string;
  };
  currentPrice: number;
  onClose: () => void;
};
declare global {
  interface Window {
    Kakao: any;
  }
}
export default function ShareCard({
  position,
  currentPrice,
  onClose,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const pnl =
    position.side === "long"
      ? (currentPrice - position.entryPrice) * position.size
      : (position.entryPrice - currentPrice) * position.size;

  const roe = (pnl / position.margin) * 100;
  const isPositive = pnl >= 0;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        width: cardRef.current.offsetWidth * 2,
        height: cardRef.current.offsetHeight * 2,
        style: {
          transform: "scale(2)",
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.download = `bithama-${position.side}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("이미지 생성 실패:", err);
    }
  };
  const handleTwitterShare = () => {
    const text = `${position.side === "long" ? "Long" : "Short"} ${position.leverage}x BTCUSDT\nROE: ${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%\nPnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT\n\n모의 선물거래 플랫폼 bithama.com`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const handleTelegramShare = () => {
    const text = `${position.side === "long" ? "Long" : "Short"} ${position.leverage}x BTCUSDT\nROE: ${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%\nPnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT\n\n모의 선물거래 플랫폼`;
    window.open(
      `https://t.me/share/url?url=https://bithama.com&text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const handleKakaoShare = () => {
    if (!window.Kakao) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `BITHAMA | ${position.side === "long" ? "Long" : "Short"} ${position.leverage}x BTCUSDT`,
        description: `ROE: ${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%  PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT`,
        imageUrl: "https://bithama.com/og-image.png",
        link: {
          mobileWebUrl: "https://bithama.com",
          webUrl: "https://bithama.com",
        },
      },
      buttons: [
        {
          title: "BITHAMA에서 거래하기",
          link: {
            mobileWebUrl: "https://bithama.com",
            webUrl: "https://bithama.com",
          },
        },
      ],
    });
  };
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 */}
        <div
          ref={cardRef}
          className="w-80 rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "linear-gradient(135deg, #0a1628 0%, #0f2347 100%)",
            border: "1px solid rgba(56, 139, 253, 0.3)",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">BITHAMA</span>
            <span className="text-gray-400 text-xs">bithama.com</span>
          </div>

          {/* 심볼 + 방향 */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-xl">BTCUSDT</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                position.side === "long"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {position.side === "long" ? "Long" : "Short"} {position.leverage}x
            </span>
            <span className="text-gray-500 text-xs">
              {position.marginType === "isolated" ? "Isolated" : "Cross"}
            </span>
          </div>

          {/* ROE */}
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">ROE</span>
            <span
              className={`text-4xl font-bold ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {roe.toFixed(2)}%
            </span>
          </div>

          {/* 상세 정보 */}
          <div className="grid grid-cols-2 gap-3 border-t border-gray-700/50 pt-4">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">PnL (USDT)</span>
              <span
                className={`font-bold text-sm ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {pnl.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">진입가</span>
              <span className="text-white text-sm font-bold">
                ${position.entryPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">현재가</span>
              <span className="text-white text-sm font-bold">
                ${currentPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">수량</span>
              <span className="text-white text-sm font-bold">
                {position.size} BTC
              </span>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
            <span className="text-gray-600 text-xs">모의 선물거래 플랫폼</span>
            <span className="text-blue-400 text-xs">bithama.com</span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            이미지 저장
          </button>
          <button
            onClick={handleTwitterShare}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-black hover:bg-gray-900 transition-colors"
          >
            X 공유
          </button>
          <button
            onClick={handleTelegramShare}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#229ED9] hover:bg-[#1a8bc2] transition-colors"
          >
            텔레그램
          </button>
          <button
            onClick={handleKakaoShare}
            className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-[#FEE500] hover:bg-[#e6cf00] transition-colors"
          >
            카카오
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-gray-700 hover:border-gray-500 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
