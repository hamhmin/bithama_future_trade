"use client";

import { useState, useEffect, useMemo } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "@/component/common/GuestModal";
import MarginLeverageBar from "./order/MarginLeverageBar";
import MarginModal from "./order/MarginModal";
import LeverageModal from "./order/LeverageModal";
import OrderForm from "./order/OrderForm";
import CloseForm from "./order/CloseForm";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  fetchPositions,
  fetchOrders,
  fetchMe,
  fetchSetting,
} from "@/lib/queries";

type OrderType = "market" | "limit";
type Side = "long" | "short";
type MarginType = "isolated" | "cross";

const MAINTENANCE_MARGIN_RATE = 0.005;

export default function OrderPanel() {
  const queryClient = useQueryClient();
  const currentPrice = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price) : 0,
  );
  const authStatus = useFutureStore((state) => state.authStatus);
  const selectedPrice = useFutureStore((state) => state.selectedPrice);
  const setSelectedPrice = useFutureStore((state) => state.setSelectedPrice);

  const isLoggedIn = authStatus === "logged-in";
  const isGuest = authStatus === "guest";

  const [side, setSide] = useState<Side>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [localLeverage, setLocalLeverage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_leverage");
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [orderTab, setOrderTab] = useState<"open" | "close">("open");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  // 쿼리
  const { data: positions = [], isLoading: posLoading } = useQuery({
    queryKey: QUERY_KEYS.positions,
    queryFn: fetchPositions,
    enabled: isLoggedIn,
  });

  const { data: orders = [] } = useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: fetchOrders,
    enabled: isLoggedIn,
  });

  const { data: me } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: fetchMe,
    enabled: isLoggedIn,
  });

  const { data: setting } = useQuery({
    queryKey: QUERY_KEYS.setting,
    queryFn: fetchSetting,
    enabled: isLoggedIn,
  });

  // 파생 상태
  const existing = positions.find((p: any) => p.side === side);
  const openPosition = existing ?? null;
  const wallet = me?.wallet ?? null;
  const marginType: MarginType = setting?.marginType ?? "isolated";
  const marginTypeLocked = positions.length > 0 || orders.length > 0;
  const hasSidePosition = !!existing;
  const fetchLoading = isLoggedIn && posLoading;
  const leverage = existing?.leverage ?? localLeverage;
  const minLeverage =
    openPosition?.marginType === "isolated" ? openPosition.leverage : 1;

  // 포지션 레버리지 동기화
  useEffect(() => {
    if (existing) {
      const currentLeverage = existing.leverage;
      setLocalLeverage(currentLeverage);
      const saved = localStorage.getItem("selected_leverage");
      if (saved !== currentLeverage.toString()) {
        localStorage.setItem("selected_leverage", currentLeverage.toString());
      }
    }
  }, [existing?.leverage, side]);

  // 게스트 상태 초기화
  useEffect(() => {
    if (isGuest) {
      setSize("");
      setPrice("");
      setTakeProfit("");
      setStopLoss("");
      setMessage("");
      setLocalLeverage(10);
    }
  }, [isGuest]);

  // 지정가 자동 입력
  useEffect(() => {
    if (!selectedPrice) return;
    setOrderType("limit");
    setPrice(selectedPrice.toString());
    setSelectedPrice(null);
  }, [selectedPrice]);

  const handleMarginTypeChange = async (type: MarginType) => {
    if (marginTypeLocked) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/setting/margin-type`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ marginType: type }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("마진타입 변경 완료!");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.setting });
      } else {
        toast.error(data.message);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!size || parseFloat(size) <= 0) {
      setMessage("수량을 입력해주세요.");
      return;
    }
    if (orderType === "limit" && (!price || parseFloat(price) <= 0)) {
      setMessage("지정가를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            side,
            type: orderType,
            price: orderType === "limit" ? parseFloat(price) : undefined,
            size: parseFloat(size),
            leverage,
            takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
            stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "주문 실패");
      } else {
        setMessage(data.message ?? "주문 완료!");
        setSize("");
        setPrice("");
        setTakeProfit("");
        setStopLoss("");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.positions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
  };

  const executionPrice =
    orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const margin =
    executionPrice && parseFloat(size)
      ? (executionPrice * parseFloat(size)) / leverage
      : 0;

  const previewLiqPrice = useMemo(() => {
    if (!executionPrice || parseFloat(size) <= 0) return 0;
    if (marginType === "isolated") {
      return side === "long"
        ? executionPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
        : executionPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
    }
    return 0;
  }, [executionPrice, size, marginType, side, leverage]);

  return (
    <div className="w-full h-full flex flex-col p-3 gap-3 text-sm">
      {/* 마진타입 + 레버리지 */}
      <MarginLeverageBar
        marginType={marginType}
        leverage={leverage}
        marginTypeLocked={marginTypeLocked || fetchLoading}
        hasSidePosition={hasSidePosition}
        fetchLoading={fetchLoading}
        isGuest={isGuest}
        onMarginClick={() => {
          if (isGuest) {
            setShowModal(true);
            return;
          }
          setShowMarginModal(true);
        }}
        onLeverageClick={() => {
          if (isGuest) {
            setShowModal(true);
            return;
          }
          setShowLeverageModal(true);
        }}
      />

      <div className="flex rounded overflow-hidden border border-gray-700">
        <button
          onClick={() => setOrderTab("open")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            orderTab === "open"
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setOrderTab("close")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            orderTab === "close"
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Close
        </button>
      </div>

      {/* Long / Short 탭 */}
      {orderTab === "open" ? (
        <>
          {/* Long / Short 탭 */}
          <div className="flex rounded overflow-hidden border border-gray-700">
            <button
              onClick={() => setSide("long")}
              className={`flex-1 py-2 font-bold transition-colors ${
                side === "long"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setSide("short")}
              className={`flex-1 py-2 font-bold transition-colors ${
                side === "short"
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Short
            </button>
          </div>

          {/* 시장가 / 지정가 탭 */}
          <div className="flex gap-2">
            {(["market", "limit"] as OrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  orderType === t
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "market" ? "시장가" : "지정가"}
              </button>
            ))}
          </div>

          {/* 주문 폼 */}
          <OrderForm
            side={side}
            orderType={orderType}
            price={price}
            size={size}
            currentPrice={currentPrice}
            margin={margin}
            previewLiqPrice={previewLiqPrice}
            wallet={wallet}
            message={message}
            loading={loading}
            authStatus={authStatus}
            executionPrice={executionPrice}
            leverage={leverage}
            onPriceChange={setPrice}
            onSizeChange={setSize}
            onSubmit={handleSubmit}
            onLoginClick={() => setShowModal(true)}
            takeProfit={takeProfit}
            stopLoss={stopLoss}
            onTakeProfitChange={setTakeProfit}
            onStopLossChange={setStopLoss}
          />
        </>
      ) : (
        <CloseForm onSuccess={handleRefresh} />
      )}

      {/* 마진타입 모달 */}
      {showMarginModal && (
        <MarginModal
          marginType={marginType}
          onClose={() => setShowMarginModal(false)}
          onChange={handleMarginTypeChange}
        />
      )}

      {/* 레버리지 모달 */}
      {showLeverageModal && (
        <LeverageModal
          leverage={leverage}
          minLeverage={minLeverage}
          openPosition={openPosition}
          onClose={() => setShowLeverageModal(false)}
          onChange={(val: number) => {
            setLocalLeverage(val);
            localStorage.setItem("selected_leverage", val.toString());
          }}
        />
      )}

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
