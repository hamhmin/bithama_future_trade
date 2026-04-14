"use client";

import { useState } from "react";
import { useFutureStore } from "@/store/useFutureStore";

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
        `http://localhost:4000/api/future/position/${position.id}/add-margin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount: parseFloat(amount) }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message);
      } else {
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
  position: Position;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [leverage, setLeverage] = useState(position.leverage);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const MAINTENANCE_MARGIN_RATE = 0.005;
  const newLiqPrice =
    position.side === "long"
      ? position.entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
      : position.entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
  const newMargin = (position.entryPrice * position.size) / leverage;

  const handleSubmit = async () => {
    if (leverage <= position.leverage) {
      setMessage(`${position.leverage}x보다 높게만 설정 가능해요.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/future/position/${position.id}/leverage`,
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
      } else {
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
        <h3 className="text-white font-bold">레버리지 변경</h3>
        <p className="text-gray-400 text-xs">
          현재 {position.leverage}x → 상향만 가능해요
        </p>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>레버리지</span>
            <span className="text-white font-bold">{leverage}x</span>
          </div>
          <input
            type="range"
            min={position.marginType === "isolated" ? position.leverage + 1 : 1}
            max={100}
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-gray-600 text-xs">
            <span>{position.leverage + 1}x</span>
            <span>100x</span>
          </div>
        </div>

        {/* 변경 후 미리보기 */}
        <div className="flex flex-col gap-1 text-xs bg-gray-700 rounded p-3">
          <div className="flex justify-between text-gray-400">
            <span>변경 후 증거금</span>
            <span className="text-white">${newMargin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>변경 후 청산가</span>
            <span className="text-orange-400">${newLiqPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>환원되는 잔고</span>
            <span className="text-green-400">
              +${(position.margin - newMargin).toFixed(2)}
            </span>
          </div>
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
            {loading ? "처리중..." : "변경"}
          </button>
        </div>
      </div>
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
        `http://localhost:4000/api/future/position/${position.id}/tpsl`,
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
        setMessage(data.message);
      } else {
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

  const calcPnl = (position: Position) => {
    if (!currentPrice) return 0;
    return position.side === "long"
      ? (currentPrice - position.entryPrice) * position.size
      : (position.entryPrice - currentPrice) * position.size;
  };

  const calcRoe = (position: Position) => {
    const pnl = calcPnl(position);
    return (pnl / position.margin) * 100;
  };

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
            const pnl = calcPnl(pos);
            const roe = calcRoe(pos);
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
                  <button
                    onClick={() => onClose(pos.id)}
                    disabled={loading}
                    className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-red-600 text-white transition-colors"
                  >
                    청산
                  </button>
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
    </>
  );
}
