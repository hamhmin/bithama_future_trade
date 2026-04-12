"use client";

import { useEffect, useState } from "react";
import { useFutureStore } from "@/store/useFutureStore";

type Position = {
  id: number;
  side: string;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  status: string;
  createdAt: string;
};

type Order = {
  id: number;
  side: string;
  type: string;
  price: number;
  size: number;
  leverage: number;
  margin: number;
  status: string;
  createdAt: string;
};

type Tab = "positions" | "orders" | "history";

export default function PositionPanel() {
  const tradeData = useFutureStore((state) => state.tradeData);
  const currentPrice = tradeData ? parseFloat(tradeData.price) : 0;

  const [tab, setTab] = useState<Tab>("positions");
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // 포지션 목록 가져오기
  const fetchPositions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/positions", {
        credentials: "include",
      });
      const data = await res.json();
      setPositions(data);
    } catch {
      console.error("포지션 로딩 실패");
    }
  };

  // 주문 목록 가져오기
  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/orders", {
        credentials: "include",
      });
      const data = await res.json();
      setOrders(data);
    } catch {
      console.error("주문 로딩 실패");
    }
  };

  // 거래내역 가져오기
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/history", {
        credentials: "include",
      });
      const data = await res.json();
      setHistory(data);
    } catch {
      console.error("거래내역 로딩 실패");
    }
  };

  // 탭 바뀔 때마다 데이터 fetch
  useEffect(() => {
    if (tab === "positions") fetchPositions();
    if (tab === "orders") fetchOrders();
    if (tab === "history") fetchHistory();
  }, [tab]);

  // 5초마다 자동 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "positions") fetchPositions();
      if (tab === "orders") fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [tab]);

  // 미실현 손익 계산
  const calcPnl = (position: Position) => {
    if (!currentPrice) return 0;
    if (position.side === "long") {
      return (currentPrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - currentPrice) * position.size;
    }
  };

  // 수익률 계산
  const calcRoe = (position: Position) => {
    const pnl = calcPnl(position);
    return (pnl / position.margin) * 100;
  };

  // 포지션 청산
  const closePosition = async (positionId: number) => {
    if (!confirm("포지션을 청산할까요?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/future/position/${positionId}/close`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await res.json();
      alert(data.message);
      fetchPositions();
    } catch {
      alert("청산 실패");
    } finally {
      setLoading(false);
    }
  };

  // 주문 취소
  const cancelOrder = async (orderId: number) => {
    if (!confirm("주문을 취소할까요?")) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/future/order/${orderId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      alert(data.message);
      fetchOrders();
    } catch {
      alert("취소 실패");
    }
  };

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: "positions", label: `포지션 (${positions.length})` },
    { key: "orders", label: `주문 (${orders.length})` },
    { key: "history", label: "거래내역" },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm">

      {/* 탭 */}
      <div className="flex border-b border-gray-700">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs transition-colors ${
              tab === key
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto">

        {/* 포지션 탭 */}
        {tab === "positions" && (
          <div>
            {positions.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
                오픈 포지션이 없어요
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="px-3 py-2 text-left">심볼</th>
                    <th className="px-3 py-2 text-left">방향</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">진입가</th>
                    <th className="px-3 py-2 text-right">청산가</th>
                    <th className="px-3 py-2 text-right">증거금</th>
                    <th className="px-3 py-2 text-right">미실현 손익</th>
                    <th className="px-3 py-2 text-right">수익률</th>
                    <th className="px-3 py-2 text-center">청산</th>
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
                        <td className="px-3 py-2 text-white">BTCUSDT</td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-bold ${
                              pos.side === "long"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {pos.side === "long" ? "Long" : "Short"}{" "}
                            {pos.leverage}x
                          </span>
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
                        <td className="px-3 py-2 text-right text-white">
                          ${pos.margin.toFixed(2)}
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
                            onClick={() => closePosition(pos.id)}
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
            )}
          </div>
        )}

        {/* 주문 탭 */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
                미체결 주문이 없어요
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="px-3 py-2 text-left">심볼</th>
                    <th className="px-3 py-2 text-left">방향</th>
                    <th className="px-3 py-2 text-left">종류</th>
                    <th className="px-3 py-2 text-right">주문가</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">증거금</th>
                    <th className="px-3 py-2 text-center">취소</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="px-3 py-2 text-white">BTCUSDT</td>
                      <td className="px-3 py-2">
                        <span
                          className={`font-bold ${
                            order.side === "long"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {order.side === "long" ? "Long" : "Short"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">
                        {order.type === "limit" ? "지정가" : "시장가"}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        ${order.price?.toLocaleString() ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        {order.size} BTC
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        ${order.margin.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-red-600 text-white transition-colors"
                        >
                          취소
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 거래내역 탭 */}
        {tab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
                거래내역이 없어요
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="px-3 py-2 text-left">심볼</th>
                    <th className="px-3 py-2 text-left">방향</th>
                    <th className="px-3 py-2 text-left">종류</th>
                    <th className="px-3 py-2 text-right">체결가</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">증거금</th>
                    <th className="px-3 py-2 text-right">일시</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="px-3 py-2 text-white">BTCUSDT</td>
                      <td className="px-3 py-2">
                        <span
                          className={`font-bold ${
                            order.side === "long"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {order.side === "long" ? "Long" : "Short"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">
                        {order.type === "limit" ? "지정가" : "시장가"}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        ${order.price?.toLocaleString() ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        {order.size} BTC
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        ${order.margin.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">
                        {new Date(order.createdAt).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}