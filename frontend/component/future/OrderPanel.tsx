"use client";

import { useState, useEffect } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import GuestModal from "@/component/common/GuestModal";

type OrderType = "market" | "limit";
type Side = "long" | "short";
type AuthStatus = "loading" | "guest" | "logged-in";
type MarginType = "isolated" | "cross";

export default function OrderPanel() {
  const currentPrice = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price) : 0,
  );

  const [showModal, setShowModal] = useState(false);
  const [side, setSide] = useState<Side>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [marginType, setMarginType] = useState<MarginType>("isolated");
  const [marginTypeLocked, setMarginTypeLocked] = useState(false); // 포지션 있으면 잠김
  const authStatus = useFutureStore((state) => state.authStatus);
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const shouldRefresh = useFutureStore((state) => state.shouldRefresh);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [wallet, setWallet] = useState<{
    balance: number;
    locked: number;
  } | null>(null);

  // 현재 오픈 포지션 가져오기
  const [openPosition, setOpenPosition] = useState<{
    leverage: number;
    marginType: string;
  } | null>(null);

  useEffect(() => {
    if (!shouldRefresh || authStatus !== "logged-in") return;
    // fetchPosition이 useEffect 안에 있어서 직접 호출 불가
    // side나 authStatus를 트리거로 재실행시키는 대신
    // 임시 fetch로 처리
    const refresh = async () => {
      const [posRes, ordRes] = await Promise.all([
        fetch("http://localhost:4000/api/future/positions", {
          credentials: "include",
        }),
        fetch("http://localhost:4000/api/future/orders", {
          credentials: "include",
        }),
      ]);
      if (!posRes.ok || !ordRes.ok) return;
      const positions = await posRes.json();
      const orders = await ordRes.json();
      const existingPos = positions.find((p: any) => p.side === side);
      setOpenPosition(existingPos ?? null);
      setMarginTypeLocked(positions.length > 0 || orders.length > 0);
    };
    refresh();
  }, [shouldRefresh]);

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
    // 5초마다 갱신 추가 (청산 후 자동 해제)
  }, [authStatus]);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const [posRes, ordRes] = await Promise.all([
          fetch("http://localhost:4000/api/future/positions", {
            credentials: "include",
          }),
          fetch("http://localhost:4000/api/future/orders", {
            credentials: "include",
          }),
        ]);

        if (!posRes.ok || !ordRes.ok) return;

        const positions = await posRes.json();
        const orders = await ordRes.json();

        const existingPos = positions.find((p: any) => p.side === side);
        setOpenPosition(existingPos ?? null);

        // 포지션 or 미체결 주문 있으면 잠금
        setMarginTypeLocked(positions.length > 0 || orders.length > 0);
      } catch {}

      // 지갑 가져오기 (fetchPosition useEffect 안에 추가)
      const walletRes = await fetch("http://localhost:4000/api/auth/me", {
        credentials: "include",
      });
      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.wallet);
      }
    };

    if (authStatus === "logged-in") fetchPosition();
    const interval = setInterval(() => {
      if (authStatus === "logged-in") fetchPosition();
    }, 5000);

    return () => clearInterval(interval);
  }, [authStatus, side]);

  // 마진타입 변경 함수
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
      if (res.ok) {
        setMarginType(type);
      } else {
        alert(data.message);
      }
    } catch {}
  };

  // 레버리지 최솟값 계산
  const minLeverage =
    openPosition?.marginType === "isolated"
      ? openPosition.leverage // Isolated면 현재 레버리지가 최솟값
      : 1; // Cross거나 포지션 없으면 1부터

  // 증거금 계산
  const executionPrice =
    orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const margin =
    executionPrice && parseFloat(size)
      ? (executionPrice * parseFloat(size)) / leverage
      : 0;

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
          marginType,
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

  // 예상 청산가 계산
  const MAINTENANCE_MARGIN_RATE = 0.005;
  const previewLiqPrice =
    executionPrice && parseFloat(size) > 0
      ? marginType === "isolated"
        ? side === "long"
          ? executionPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
          : executionPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE)
        : 0 // cross는 지갑 잔고 필요해서 생략
      : 0;

  return (
    <div className="w-full h-full flex flex-col p-3 gap-3 text-sm">
      {/* 상단 마진타입 + 레버리지 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (marginTypeLocked) return;
            setShowMarginModal(true);
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
            marginTypeLocked
              ? "border-gray-700 text-gray-500 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
          }`}
        >
          {marginType === "isolated" ? "Isolated" : "Cross"}
          {!marginTypeLocked && <span className="text-gray-500">▾</span>}
        </button>

        <button
          onClick={() => setShowLeverageModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white transition-colors"
        >
          {leverage}x<span className="text-gray-500">▾</span>
        </button>

        {marginTypeLocked && (
          <span className="text-yellow-400 text-xs">
            포지션 청산 후 변경 가능
          </span>
        )}
      </div>

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

      {/* 지정가 입력 */}
      {orderType === "limit" && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">주문가 (USDT)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={currentPrice.toFixed(2)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* 수량 입력 */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-xs">수량 (BTC)</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="0.000"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 가용 잔고 + 증거금 */}
      <div className="flex flex-col gap-1 bg-gray-800 rounded px-3 py-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>가용 잔고</span>
          <span className="text-white">
            {wallet ? `${wallet.balance.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>증거금</span>
          <span className="text-white">
            {margin > 0 ? `${margin.toFixed(2)} USDT` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>예상 청산가</span>
          <span className="text-orange-400">
            {previewLiqPrice > 0 ? `$${previewLiqPrice.toLocaleString()}` : "-"}
          </span>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`text-xs text-center py-1 rounded ${
            message.includes("완료") || message.includes("!")
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* 주문 버튼 or 로그인 유도 */}
      {authStatus === "guest" ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 rounded font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          로그인 후 주문하기
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={loading || authStatus === "loading"}
          className={`w-full py-3 rounded font-bold text-white transition-colors ${
            loading || authStatus === "loading"
              ? "bg-gray-600 cursor-not-allowed"
              : side === "long"
                ? "bg-green-600 hover:bg-green-500"
                : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {loading ? "처리중..." : side === "long" ? "Long 주문" : "Short 주문"}
        </button>
      )}

      {/* 마진타입 변경 모달 */}
      {showMarginModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
          onClick={() => setShowMarginModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 w-64 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-sm">마진 타입</h3>
            <div className="flex flex-col gap-2">
              {(["isolated", "cross"] as MarginType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    handleMarginTypeChange(type);
                    setShowMarginModal(false);
                  }}
                  className={`py-2 rounded text-sm font-bold transition-colors ${
                    marginType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {type === "isolated" ? "Isolated" : "Cross"}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs text-center">
              {marginType === "isolated"
                ? "포지션마다 증거금이 분리돼요"
                : "지갑 전체가 증거금으로 사용돼요"}
            </p>
          </div>
        </div>
      )}

      {/* 레버리지 변경 모달 */}
      {showLeverageModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
          onClick={() => setShowLeverageModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 w-64 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-sm">레버리지 설정</h3>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>레버리지</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
              <input
                type="range"
                min={minLeverage}
                max={100}
                value={leverage < minLeverage ? minLeverage : leverage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val < minLeverage) return;
                  setLeverage(val);
                }}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-gray-600 text-xs">
                <span>{minLeverage}x</span>
                <span>25x</span>
                <span>50x</span>
                <span>75x</span>
                <span>100x</span>
              </div>
              {openPosition?.marginType === "isolated" && (
                <p className="text-yellow-400 text-xs">
                  Isolated 포지션 보유 중 → {openPosition.leverage}x 이상만
                  가능해요
                </p>
              )}
            </div>
            <button
              onClick={() => setShowLeverageModal(false)}
              className="w-full py-2 rounded text-white bg-blue-600 hover:bg-blue-500 text-sm font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 게스트 모달 */}
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
