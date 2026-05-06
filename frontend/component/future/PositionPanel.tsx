"use client";

import { useState } from "react";
import PositionTable from "./position/PositionTable";
import OrderTable from "./position/OrderTable";
import HistoryTable from "./position/HistoryTable";
import GuestModal from "../common/GuestModal";
import { useFutureStore } from "@/store/useFutureStore";
import AssetsTab from "./position/AssetsTab";
import PositionHistoryTab from "./position/PositionHistoryTab";
import TransactionHistoryTab from "./position/TransactionHistoryTab";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchPositions, fetchOrders, fetchAssets } from "@/lib/queries";

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
  takeProfit: number | null;
  stopLoss: number | null;
  marginType: string;
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
  fee: number | null;
  feeType: string | null;
};

type Tab =
  | "positions"
  | "orders"
  | "history"
  | "positionHistory"
  | "transaction"
  | "assets";

export default function PositionPanel() {
  const queryClient = useQueryClient();
  const authStatus = useFutureStore((state) => state.authStatus);
  const isLoggedIn = authStatus === "logged-in";

  const [tab, setTab] = useState<Tab>("positions");
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: positions = [], isLoading: positionLoading } = useQuery<
    Position[]
  >({
    queryKey: QUERY_KEYS.positions,
    queryFn: fetchPositions,
    enabled: isLoggedIn,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: QUERY_KEYS.orders,
    queryFn: fetchOrders,
    enabled: isLoggedIn,
  });

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/history`,
        { credentials: "include" },
      );
      setHistory(await res.json());
    } catch {
      console.error("거래내역 로딩 실패");
    }
  };

  const closePosition = async (positionId: number) => {
    if (!confirm("포지션을 청산할까요?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/position/${positionId}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // body 없으면 전체 청산 (size = position.size)
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/order/${orderId}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
      } else {
        toast.error(data.message);
      }
    } catch {
      alert("취소 실패");
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.positions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
  };

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: "positions", label: `포지션 (${positions.length})` },
    { key: "orders", label: `주문 (${orders.length})` },
    { key: "history", label: "거래내역" },
    { key: "assets", label: "자산" },
    { key: "positionHistory", label: "포지션 히스토리" },
    { key: "transaction", label: "펀딩비 내역" },
  ];

  return (
    <div className="w-full h-[340px] md:h-full flex flex-col text-sm relative">
      {/* 탭 */}
      <div className="flex border-b border-gray-700 whitespace-nowrap w-full overflow-auto">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === "history") fetchHistory();
            }}
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
        {isLoggedIn && (
          <>
            {tab === "positions" &&
              (positionLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <PositionTable
                  positions={positions}
                  loading={loading}
                  onClose={closePosition}
                  onRefresh={handleRefresh}
                />
              ))}
            {tab === "orders" && (
              <OrderTable orders={orders} onCancel={cancelOrder} />
            )}
            {tab === "history" && <HistoryTable history={history} />}
            {tab === "assets" && <AssetsTab />}
            {tab === "positionHistory" && <PositionHistoryTab />}
            {tab === "transaction" && <TransactionHistoryTab />}
          </>
        )}
      </div>

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
