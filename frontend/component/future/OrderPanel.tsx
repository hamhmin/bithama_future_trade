"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { useTutorial } from "@/component/tutorial/useTutorial";
import TutorialOverlay from "@/component/tutorial/TutorialOverlay";
import { TUTORIAL_STEPS } from "@/component/tutorial/tutorialSteps";
import TutorialCompleteModal from "@/component/tutorial/TutorialCompleteModal";
import TutorialStartModal from "@/component/tutorial/TutorialStartModal";

type OrderType = "market" | "limit";
type Side = "long" | "short";
type MarginType = "isolated" | "cross";

const MAINTENANCE_MARGIN_RATE = 0.005;

export default function OrderPanel({
  positionPanelRef,
}: {
  positionPanelRef?: React.RefObject<HTMLDivElement | null>;
}) {
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
  const [orderFormKey, setOrderFormKey] = useState(0);

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

  const tutorial = useTutorial(me?.tutorialCompleted);

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

  const [tutorialError, setTutorialError] = useState("");
  const leverageBtnRef = useRef<HTMLButtonElement>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const leverageModalRef = useRef<HTMLDivElement>(null);
  const sizeAreaRef = useRef<HTMLDivElement>(null);

  const tutorialRefs = {
    leverageBtn: leverageBtnRef,
    sizeInput: sizeInputRef,
    leverageModal: leverageModalRef, // 추가
    submitBtn: submitBtnRef,
    sizeArea: sizeAreaRef, // 추가
    closeBtn: closeBtnRef,
    positionPanel: positionPanelRef ?? { current: null }, // 추가
  };
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
        if (tutorial.isActive && tutorial.step.id === "submit") {
          tutorial.complete(); // 완료
        }

        setMessage(data.message ?? "주문 완료!");
        setSize("");
        setPrice("");
        setTakeProfit("");
        setStopLoss("");
        setOrderFormKey((prev) => prev + 1); // 추가
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

  const handleTutorialPrev = () => {
    const prevStepId = TUTORIAL_STEPS[tutorial.currentStep - 1]?.id;

    // 2단계에서 이전 → 모달 닫기
    if (tutorial.step.id === "leverage_set") {
      setShowLeverageModal(false);
    }

    // 3단계에서 이전 → 모달 열고 2단계로
    if (tutorial.step.id === "size") {
      setShowLeverageModal(true);
    }

    tutorial.prev();
  };
  const handleTutorialNext = () => {
    if (tutorial.step.id === "size") {
      if (!size || parseFloat(size) <= 0) {
        setTutorialError(
          "수량을 입력해주세요. 💡 25%/50%/75%/100% 버튼을 눌러보세요!",
        );
        return;
      }
      const requiredMargin = (executionPrice * parseFloat(size)) / leverage;
      const fee = requiredMargin * 0.0005;
      if (!wallet || wallet.balance < requiredMargin + fee) {
        setTutorialError(
          "잔고가 부족해요. 💡 25%/50%/75%/100% 버튼을 눌러보세요!",
        );
        return;
      }
      setTutorialError("");
    }
    tutorial.next();
  };

  return (
    <div className="w-full md:h-full min-h-[530px] flex flex-col p-3 gap-3 text-sm ">
      {/* 마진타입 + 레버리지 */}
      <MarginLeverageBar
        leverageBtnRef={leverageBtnRef}
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
          if (tutorial.isActive && tutorial.step.id === "leverage_open") {
            tutorial.next(); // 2단계로
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
            key={orderFormKey} // state 초기화용
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
            sizeInputRef={sizeInputRef}
            submitBtnRef={submitBtnRef}
            sizeAreaRef={sizeAreaRef}
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
        <CloseForm onSuccess={handleRefresh} closeBtnRef={closeBtnRef} />
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
          modalRef={leverageModalRef}
          leverage={leverage}
          minLeverage={minLeverage}
          openPosition={openPosition}
          onClose={() => setShowLeverageModal(false)}
          onChange={(val: number) => {
            setLocalLeverage(val);
            localStorage.setItem("selected_leverage", val.toString());
            if (tutorial.isActive && tutorial.step.id === "leverage_set") {
              tutorial.next(); // 3단계로
            }
          }}
        />
      )}

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}

      {/* 튜토리얼 */}
      <TutorialOverlay
        isActive={tutorial.isActive}
        step={tutorial.step}
        onPrev={handleTutorialPrev}
        currentStep={tutorial.currentStep}
        totalSteps={tutorial.totalSteps}
        refs={tutorialRefs}
        onNext={handleTutorialNext}
        errorMessage={tutorialError}
        onSkip={tutorial.skip}
        isLastStep={tutorial.currentStep === tutorial.totalSteps - 1}
        showCompleteModal={tutorial.showCompleteModal}
        onConfirm={tutorial.confirmComplete}
      />
      {/* 튜토리얼 완료모달 */}
      {/* <TutorialCompleteModal onConfirm={tutorial.confirmComplete} /> */}
      {/* 튜토리얼 시작모달 */}
      {tutorial.showStartModal && (
        <TutorialStartModal
          onStart={tutorial.startTutorial}
          onSkip={tutorial.skip}
        />
      )}
    </div>
  );
}
