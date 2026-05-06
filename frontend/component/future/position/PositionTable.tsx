"use client";

import { useState, useMemo } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import ShareCard from "./ShareCard";
import toast from "react-hot-toast";
import LoadingDots from "@/component/common/LoadingDots";

type Position = {
  id: number;
  side: string;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  marginType: string;
  status: string;
  createdAt: string;
  takeProfit: number | null;
  stopLoss: number | null;
};

// 증거금 추가 모달
function AddMarginModal({
  position,
  onClose,
  onSuccess,
}: {
  position: Position;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 증거금 추가 후 예상 청산가 미리보기
  const MAINTENANCE_MARGIN_RATE = 0.005;
  const newMargin = position.margin + (parseFloat(amount) || 0);
  const effectiveLeverage = (position.entryPrice * position.size) / newMargin;
  const previewLiqPrice =
    position.side === "long"
      ? position.entryPrice *
        (1 - 1 / effectiveLeverage + MAINTENANCE_MARGIN_RATE)
      : position.entryPrice *
        (1 + 1 / effectiveLeverage - MAINTENANCE_MARGIN_RATE);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage("금액을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/position/${position.id}/add-margin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount: parseFloat(amount) }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);

        setMessage(data.message);
      } else {
        toast.success("증거금 추가 완료!");

        onSuccess();
        onClose();
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold">증거금 추가</h3>

        <div className="flex flex-col gap-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>현재 증거금</span>
            <span className="text-white">${position.margin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>현재 청산가</span>
            <span className="text-orange-400">
              ${position.liquidationPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="추가할 증거금 (USDT)"
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />

        {/* 예상 청산가 미리보기 */}
        {parseFloat(amount) > 0 && (
          <div className="flex flex-col gap-1 text-xs bg-gray-700 rounded p-3">
            <div className="flex justify-between text-gray-400">
              <span>추가 후 증거금</span>
              <span className="text-white">${newMargin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>예상 청산가</span>
              <span className="text-green-400">
                ${previewLiqPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {message && (
          <p className="text-red-400 text-xs text-center">{message}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded text-gray-400 bg-gray-700 hover:bg-gray-600 text-sm"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold"
          >
            {loading ? "처리중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 레버리지 변경 모달
function LeverageModal({
  position,
  onClose,
  onSuccess,
}: {
  position: any; // 필요시 Position 타입으로 변경
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [leverage, setLeverage] = useState(position.leverage);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const setShouldRefresh = useFutureStore((state) => state.setShouldRefresh);

  const QUICK_VALUES = [25, 50, 75, 100];
  const minLeverage =
    position.marginType === "isolated" ? position.leverage + 1 : 1;
  const maxLeverage = 100;

  const MAINTENANCE_MARGIN_RATE = 0.005;
  const newLiqPrice =
    position.side === "long"
      ? position.entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
      : position.entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
  const newMargin = (position.entryPrice * position.size) / leverage;

  const calculateProgress = () => {
    return ((leverage - minLeverage) / (maxLeverage - minLeverage)) * 100;
  };

  const handleSubmit = async () => {
    if (leverage <= position.leverage) {
      setMessage(`${position.leverage}x보다 높게만 설정 가능해요.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/position/${position.id}/leverage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ leverage }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message);
        toast.error(data.message);
      } else {
        // --- 로컬스토리지 동기화 코드 추가 ---
        localStorage.setItem("selected_leverage", leverage.toString());
        // ----------------------------------

        toast.success("레버리지 변경 완료!");
        setShouldRefresh(true); // 추가

        onSuccess();
        onClose();
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-5 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-bold text-sm">레버리지 변경</h3>
          <p className="text-gray-400 text-[10px]">
            현재 {position.leverage}x → 상향만 가능해요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end text-xs">
            <span className="text-gray-400">레버리지</span>
            <span className="text-blue-400 font-bold text-xl">{leverage}x</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <input
              type="range"
              min={minLeverage}
              max={maxLeverage}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
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

          {/* 퀵 버튼 구성 */}
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {QUICK_VALUES.map((val) => {
              const isDisabled = val < minLeverage;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setLeverage(val)}
                  className={`py-1 text-[11px] rounded font-medium transition-colors ${
                    isDisabled
                      ? "bg-gray-900 text-gray-700 cursor-not-allowed"
                      : leverage === val
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                >
                  {val}x
                </button>
              );
            })}
          </div>
        </div>

        {/* 변경 후 미리보기 박스 */}
        <div className="flex flex-col gap-1.5 text-[11px] bg-gray-900/50 rounded-lg p-3 border border-gray-700">
          <div className="flex justify-between text-gray-400">
            <span>변경 후 증거금</span>
            <span className="text-white">${newMargin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>변경 후 청산가</span>
            <span className="text-orange-400">${newLiqPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-1.5 mt-1">
            <span className="text-gray-400 font-medium">환원되는 잔고</span>
            <span className="text-green-400 font-bold">
              +${(position.margin - newMargin).toFixed(2)}
            </span>
          </div>
        </div>

        {message && (
          <p className="text-red-400 text-[10px] text-center bg-red-400/10 py-1 rounded">
            {message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded text-gray-400 bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            {loading ? "처리중..." : "변경"}
          </button>
        </div>
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
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
// TP/SL 모달 컴포넌트
function TpSlModal({
  position,
  onClose,
  onSuccess,
}: {
  position: Position;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [takeProfit, setTakeProfit] = useState(
    position.takeProfit?.toString() ?? "",
  );
  const [stopLoss, setStopLoss] = useState(position.stopLoss?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/position/${position.id}/tpsl`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        setMessage(data.message);
      } else {
        toast.success("TP/SL 설정 완료!");
        onSuccess();
        onClose();
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold">TP / SL 설정</h3>

        <div className="flex flex-col gap-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>진입가</span>
            <span className="text-white">
              ${position.entryPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>방향</span>
            <span
              className={
                position.side === "long" ? "text-green-400" : "text-red-400"
              }
            >
              {position.side === "long" ? "Long" : "Short"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-green-400 text-xs">TP 목표가 (USDT)</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder={
              position.side === "long" ? "진입가보다 높게" : "진입가보다 낮게"
            }
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-red-400 text-xs">SL 손절가 (USDT)</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder={
              position.side === "long" ? "진입가보다 낮게" : "진입가보다 높게"
            }
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        {message && (
          <p className="text-red-400 text-xs text-center">{message}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded text-gray-400 bg-gray-700 hover:bg-gray-600 text-sm"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold"
          >
            {loading ? "처리중..." : "설정"}
          </button>
        </div>
      </div>
    </div>
  );
}
// 메인 테이블
export default function PositionTable({
  positions,
  loading,
  onClose,
  onRefresh,
}: {
  positions: Position[];
  loading: boolean;
  onClose: (id: number) => void;
  onRefresh: () => void;
}) {
  const currentPrice = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price) : 0,
  );

  const [addMarginTarget, setAddMarginTarget] = useState<Position | null>(null);
  const [leverageTarget, setLeverageTarget] = useState<Position | null>(null);
  const [tpslTarget, setTpslTarget] = useState<Position | null>(null);
  const [shareTarget, setShareTarget] = useState<Position | null>(null);

  const pnlMap = useMemo(() => {
    return positions.reduce(
      (acc, pos) => {
        const pnl = !currentPrice
          ? 0
          : pos.side === "long"
            ? (currentPrice - pos.entryPrice) * pos.size
            : (pos.entryPrice - currentPrice) * pos.size;
        const roe = (pnl / pos.margin) * 100;
        acc[pos.id] = { pnl, roe };
        return acc;
      },
      {} as Record<number, { pnl: number; roe: number }>,
    );
  }, [positions, currentPrice]);

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        오픈 포지션이 없어요
      </div>
    );
  }

  return (
    <>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="px-3 py-2 text-left">심볼</th>
            <th className="px-3 py-2 text-left">방향</th>
            <th className="px-3 py-2 text-right">수량</th>
            <th className="px-3 py-2 text-right">진입가</th>
            <th className="px-3 py-2 text-right">청산가</th>
            <th className="px-3 py-2 text-right">TP/SL</th>
            <th className="px-3 py-2 text-right">증거금</th>
            <th className="px-3 py-2 text-right">미실현 손익</th>
            <th className="px-3 py-2 text-right">수익률</th>
            <th className="px-3 py-2 text-center">관리</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const { pnl, roe } = pnlMap[pos.id] ?? { pnl: 0, roe: 0 };

            const isProfit = pnl >= 0;

            return (
              <tr
                key={pos.id}
                className="border-b border-gray-800 hover:bg-gray-800"
              >
                <td className="px-3 py-2 text-white">
                  {/* 마진타입 */}
                  <span
                    className={`text-xs px-1 rounded ${
                      pos.marginType === "cross"
                        ? "text-yellow-400 bg-yellow-400/10"
                        : "text-blue-400 bg-blue-400/10"
                    }`}
                  >
                    {pos.marginType === "cross" ? "Cross" : "Iso"}
                  </span>
                  BTCUSDT
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span
                      className={`font-bold ${
                        pos.side === "long" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pos.side === "long" ? "Long" : "Short"}
                    </span>
                    {/* 레버리지 클릭 시 변경 모달 */}
                    <button
                      onClick={() => setLeverageTarget(pos)}
                      className="text-gray-400 hover:text-blue-400 text-left transition-colors"
                    >
                      {pos.leverage}x ✎
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-white">
                  {pos.size} BTC
                </td>
                <td className="px-3 py-2 text-right text-white">
                  ${pos.entryPrice.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right text-orange-400">
                  ${pos.liquidationPrice.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <button
                      onClick={() => setTpslTarget(pos)}
                      className="text-xs hover:text-blue-400 transition-colors"
                    >
                      <span className="text-green-400">
                        {pos.takeProfit
                          ? `$${pos.takeProfit.toLocaleString()}`
                          : "-"}
                      </span>
                      {" / "}
                      <span className="text-red-400">
                        {pos.stopLoss
                          ? `$${pos.stopLoss.toLocaleString()}`
                          : "-"}
                      </span>
                      🔧
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-white">${pos.margin.toFixed(2)}</span>
                    {/* 증거금 추가 버튼 */}
                    <button
                      onClick={() => setAddMarginTarget(pos)}
                      className="text-gray-500 hover:text-blue-400 text-xs transition-colors"
                    >
                      + 추가
                    </button>
                  </div>
                </td>
                <td
                  className={`px-3 py-2 text-right font-bold ${
                    isProfit ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isProfit ? "+" : ""}
                  {pnl.toFixed(2)} USDT
                </td>
                <td
                  className={`px-3 py-2 text-right font-bold ${
                    isProfit ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isProfit ? "+" : ""}
                  {roe.toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => setShareTarget(pos)}
                      className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-blue-600 text-white transition-colors"
                    >
                      공유
                    </button>
                    <button
                      onClick={() => onClose(pos.id)}
                      disabled={loading}
                      className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-red-600 text-white transition-colors min-w-[36px]"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <LoadingDots size="xs" color="white" />
                        </div>
                      ) : (
                        "빠른청산"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 증거금 추가 모달 */}
      {addMarginTarget && (
        <AddMarginModal
          position={addMarginTarget}
          onClose={() => setAddMarginTarget(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* 레버리지 변경 모달 */}
      {leverageTarget && (
        <LeverageModal
          position={leverageTarget}
          onClose={() => setLeverageTarget(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* TP/SL 변경 모달 */}
      {tpslTarget && (
        <TpSlModal
          position={tpslTarget}
          onClose={() => setTpslTarget(null)}
          onSuccess={onRefresh}
        />
      )}
      {shareTarget && (
        <ShareCard
          position={shareTarget}
          currentPrice={currentPrice}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
