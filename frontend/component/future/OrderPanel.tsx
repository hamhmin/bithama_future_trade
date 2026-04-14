"use client";

import { useState, useEffect, useRef } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "@/component/common/GuestModal";
import MarginLeverageBar from "./order/MarginLeverageBar";
import MarginModal from "./order/MarginModal";
import LeverageModal from "./order/LeverageModal";
import OrderForm from "./order/OrderForm";

type OrderType = "market" | "limit";
type Side = "long" | "short";
type MarginType = "isolated" | "cross";

const MAINTENANCE_MARGIN_RATE = 0.005;

export default function OrderPanel() {
  const currentPrice = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price) : 0,
  );
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const shouldRefresh = useFutureStore((state) => state.shouldRefresh);

  const [side, setSide] = useState<Side>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [marginType, setMarginType] = useState<MarginType>("isolated");
  const [marginTypeLocked, setMarginTypeLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [openPosition, setOpenPosition] = useState<{
    leverage: number;
    marginType: string;
  } | null>(null);
  const [wallet, setWallet] = useState<{
    balance: number;
    locked: number;
  } | null>(null);

  const minLeverage =
    openPosition?.marginType === "isolated" ? openPosition.leverage : 1;

  const executionPrice =
    orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const margin =
    executionPrice && parseFloat(size)
      ? (executionPrice * parseFloat(size)) / leverage
      : 0;

  const previewLiqPrice =
    executionPrice && parseFloat(size) > 0
      ? marginType === "isolated"
        ? side === "long"
          ? executionPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
          : executionPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE)
        : 0
      : 0;

  const fetchPosition = async () => {
    try {
      const [posRes, ordRes, meRes] = await Promise.all([
        fetch("http://localhost:4000/api/future/positions", {
          credentials: "include",
        }),
        fetch("http://localhost:4000/api/future/orders", {
          credentials: "include",
        }),
        fetch("http://localhost:4000/api/auth/me", {
          credentials: "include",
        }),
      ]);

      if (posRes.ok && ordRes.ok) {
        const positions = await posRes.json();
        const orders = await ordRes.json();
        const existing = positions.find((p: any) => p.side === side);
        setOpenPosition(existing ?? null);
        setMarginTypeLocked(positions.length > 0 || orders.length > 0);
      }

      if (meRes.ok) {
        const data = await meRes.json();
        setWallet(data.wallet);
      }
    } catch {}
  };

  // 마진타입 설정 가져오기
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/future/setting", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setMarginType(data.marginType);
      } catch {}
    };
    if (authStatus === "logged-in") fetchSetting();
  }, [authStatus]);

  // 포지션 + 잔고 가져오기
  useEffect(() => {
    if (authStatus !== "logged-in") return;
    fetchPosition();
    const interval = setInterval(fetchPosition, 5000);
    return () => clearInterval(interval);
  }, [authStatus, side]);

  // shouldRefresh 감지
  useEffect(() => {
    if (!shouldRefresh || authStatus !== "logged-in") return;
    fetchPosition();
  }, [shouldRefresh]);

  const handleMarginTypeChange = async (type: MarginType) => {
    if (marginTypeLocked) return;
    try {
      const res = await fetch(
        "http://localhost:4000/api/future/setting/margin-type",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ marginType: type }),
        },
      );
      const data = await res.json();
      if (res.ok) setMarginType(type);
      else alert(data.message);
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
      const res = await fetch("http://localhost:4000/api/future/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          side,
          type: orderType,
          price: orderType === "limit" ? parseFloat(price) : undefined,
          size: parseFloat(size),
          leverage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "주문 실패");
      } else {
        setMessage(data.message ?? "주문 완료!");
        setSize("");
        setPrice("");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 gap-3 text-sm">
      {/* 마진타입 + 레버리지 */}
      <MarginLeverageBar
        marginType={marginType}
        leverage={leverage}
        marginTypeLocked={marginTypeLocked}
        onMarginClick={() => setShowMarginModal(true)}
        onLeverageClick={() => setShowLeverageModal(true)}
      />

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
      />

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
          onChange={setLeverage}
        />
      )}

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
