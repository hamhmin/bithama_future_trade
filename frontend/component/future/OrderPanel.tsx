"use client";

import { useState, useEffect, useRef } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "@/component/common/GuestModal";
import MarginLeverageBar from "./order/MarginLeverageBar";
import MarginModal from "./order/MarginModal";
import LeverageModal from "./order/LeverageModal";
import OrderForm from "./order/OrderForm";
import CloseForm from "./order/CloseForm";
import toast from "react-hot-toast";

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
  const setShouldRefresh = useFutureStore((state) => state.setShouldRefresh);

  const selectedPrice = useFutureStore((state) => state.selectedPrice);
  const setSelectedPrice = useFutureStore((state) => state.setSelectedPrice);

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
  const [orderTab, setOrderTab] = useState<"open" | "close">("open");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [fetchLoading, setFetchLoading] = useState(false); // fetchLoading은 로그인 상태일 때만 true로 시작

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
    setFetchLoading(true); // 시작 시 로딩

    try {
      const [posRes, ordRes, meRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/future/positions`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/future/orders`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include",
        }),
      ]);

      if (posRes.ok && ordRes.ok) {
        const positions = await posRes.json();
        const orders = await ordRes.json();
        const existing = positions.find((p: any) => p.side === side);
        setOpenPosition(existing ?? null);
        setMarginTypeLocked(positions.length > 0 || orders.length > 0);

        // 포지션 있으면 현재 레버리지로 동기화
        if (existing) {
          setLeverage(existing.leverage);
        }
      }

      if (meRes.ok) {
        const data = await meRes.json();
        setWallet(data.wallet);
      }
    } catch {
    } finally {
      setFetchLoading(false); // 완료 시 해제
    }
  };

  useEffect(() => {
    if (!selectedPrice) return;
    setOrderType("limit"); // 지정가로 자동 전환
    setPrice(selectedPrice.toString());
    setSelectedPrice(null); // 초기화
  }, [selectedPrice]);

  // 마진타입 설정 가져오기
  useEffect(() => {
    if (authStatus === "guest") {
      setMarginType("isolated");
      setLeverage(10);
      setMarginTypeLocked(false);
      setWallet(null);
      setOpenPosition(null);
      setSize("");
      setPrice("");
      setTakeProfit("");
      setStopLoss("");
      setMessage("");
    }
    const fetchSetting = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/future/setting`,
          {
            credentials: "include",
          },
        );
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
    setFetchLoading(true);
    fetchPosition();
    // const interval = setInterval(fetchPosition, 5000);
    // return () => clearInterval(interval);
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/future/setting/margin-type`,
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
        setShouldRefresh(true); // 직접 트리거
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
  return (
    <div className="w-full h-full flex flex-col p-3 gap-3 text-sm">
      {/* 마진타입 + 레버리지 */}
      <MarginLeverageBar
        marginType={marginType}
        leverage={leverage}
        marginTypeLocked={marginTypeLocked || fetchLoading}
        fetchLoading={fetchLoading}
        isGuest={authStatus === "guest"}
        onMarginClick={() => {
          if (authStatus === "guest") {
            setShowModal(true); // 게스트 모달
            return;
          }
          setShowMarginModal(true);
        }}
        onLeverageClick={() => {
          if (authStatus === "guest") {
            setShowModal(true); // 게스트 모달
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
        <CloseForm onSuccess={fetchPosition} />
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
          onChange={setLeverage}
        />
      )}

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
