"use client";

import { useEffect, useState } from "react";
import PositionTable from "./position/PositionTable";
import OrderTable from "./position/OrderTable";
import HistoryTable from "./position/HistoryTable";
import GuestModal from "../common/GuestModal";
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
type AuthStatus = "loading" | "guest" | "logged-in";

export default function PositionPanel() {
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const shouldRefresh = useFutureStore((state) => state.shouldRefresh);
  const setShouldRefresh = useFutureStore((state) => state.setShouldRefresh);

  const [tab, setTab] = useState<Tab>("positions");
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 로그인 상태 체크
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          credentials: "include",
        });
        setAuthStatus(res.ok ? "logged-in" : "guest");
      } catch {
        setAuthStatus("guest");
      }
    };
    checkAuth();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/positions", {
        credentials: "include",
      });
      setPositions(await res.json());
    } catch {
      console.error("포지션 로딩 실패");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/orders", {
        credentials: "include",
      });
      setOrders(await res.json());
    } catch {
      console.error("주문 로딩 실패");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/future/history", {
        credentials: "include",
      });
      setHistory(await res.json());
    } catch {
      console.error("거래내역 로딩 실패");
    }
  };

  useEffect(() => {
    if (authStatus !== "logged-in") return;

    // 탭 상관없이 항상 둘 다 fetch
    fetchPositions();
    fetchOrders();
    if (tab === "history") fetchHistory();
  }, [tab, authStatus]);

  useEffect(() => {
    if (!shouldRefresh) return;
    fetchPositions();
    fetchOrders();
    setShouldRefresh(false);
  }, [shouldRefresh]);

  const closePosition = async (positionId: number) => {
    if (!confirm("포지션을 청산할까요?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/future/position/${positionId}/close`,
        { method: "POST", credentials: "include" },
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

  const cancelOrder = async (orderId: number) => {
    if (!confirm("주문을 취소할까요?")) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/future/order/${orderId}`,
        { method: "DELETE", credentials: "include" },
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
    <div className="w-full h-full flex flex-col text-sm relative">
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
        {/* 로딩 */}
        {authStatus === "loading" && (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 비로그인 */}
        {authStatus === "guest" && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-500 text-xs">
              로그인하면 포지션과 주문내역을 확인할 수 있어요
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded text-xs font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                게스트로 시작
              </button>
            </div>
          </div>
        )}

        {/* 로그인 상태 */}
        {authStatus === "logged-in" && (
          <>
            {tab === "positions" && (
              <PositionTable
                positions={positions}
                loading={loading}
                onClose={closePosition}
                onRefresh={fetchPositions}
              />
            )}
            {tab === "orders" && (
              <OrderTable orders={orders} onCancel={cancelOrder} />
            )}
            {tab === "history" && <HistoryTable history={history} />}
          </>
        )}
      </div>

      {/* 게스트 모달 */}
      {showModal && (
        <GuestModal
          onClose={() => setShowModal(false)}
          onLogin={() => {
            setAuthStatus("logged-in");
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
