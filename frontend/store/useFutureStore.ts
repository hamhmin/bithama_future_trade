import { create } from "zustand";
import toast from "react-hot-toast";

import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
// store 외부에 queryClient 인스턴스
let _queryClient: QueryClient | null = null;
export const setQueryClient = (client: QueryClient) => {
  _queryClient = client;
};
const invalidateAll = () => {
  if (!_queryClient) return;
  _queryClient.invalidateQueries({ queryKey: QUERY_KEYS.positions });
  _queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
  _queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
  _queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
};

type AuthStatus = "loading" | "guest" | "logged-in";

interface TradeData {
  type: string;
  price: string;
  quantity: string;
  time: number;
}
interface OrderItem {
  price: string;
  quantity: string;
}
interface DepthData {
  type: string;
  bids: OrderItem[]; // string[] 대신 OrderItem[] 사용
  asks: OrderItem[];
}

interface FutureStore {
  tradeData: TradeData | null; //소켓에서 받은 체결가 최신 데이터
  depthData: DepthData; //소켓에서 받은 호가창 최신 데이터
  // setTradeData: (data: TradeData) => void; //tradeData 바꾸는 함수
  socket: WebSocket | null; //열려있는 소켓 객체
  connectSocket: () => void; //소켓 여는 함수
  disconnectSocket: () => void; //소켓 닫는 함수
  authStatus: AuthStatus;
  setAuthStatus: (status: AuthStatus) => void;
  shouldRefresh: boolean;
  setShouldRefresh: (v: boolean) => void;
  selectedPrice: number | null;
  setSelectedPrice: (v: number | null) => void;
  // setTradeData: (v: TradeData) => void;
  // setDepthData: (v: DepthData) => void;
  lastDisconnectedAt: number | null;
  setLastDisconnectedAt: (t: number | null) => void;
}

const dummyDepthData = {
  type: "호가창",
  bids: [
    { price: "68408.14", quantity: "4.83671" },
    { price: "68408.13", quantity: "0.00016" },
    { price: "68408.12", quantity: "0.10810" },
    { price: "68408.11", quantity: "0.14397" },
    { price: "68408.10", quantity: "0.12573" },
    { price: "68408.00", quantity: "0.00120" },
    { price: "68407.84", quantity: "0.00309" },
    { price: "68407.67", quantity: "0.08778" },
    { price: "68407.45", quantity: "0.00239" },
    { price: "68407.28", quantity: "0.00021" },
  ],
  asks: [
    { price: "68408.15", quantity: "0.38872" },
    { price: "68408.16", quantity: "0.00032" },
    { price: "68408.19", quantity: "0.00024" },
    { price: "68408.20", quantity: "0.05040" },
    { price: "68408.55", quantity: "0.00008" },
    { price: "68409.88", quantity: "0.00008" },
    { price: "68411.27", quantity: "0.00027" },
    { price: "68411.30", quantity: "0.00008" },
    { price: "68411.31", quantity: "0.00008" },
    { price: "68411.60", quantity: "0.00008" },
  ],
};
const emptyDepthData = {
  type: "호가창",
  bids: [],
  asks: [],
};
export const useFutureStore = create<FutureStore>((set, get) => ({
  lastDisconnectedAt: null,
  setLastDisconnectedAt: (t) => set({ lastDisconnectedAt: t }),

  selectedPrice: null,
  setSelectedPrice: (price) => {
    set({ selectedPrice: price });
  },

  depthData: emptyDepthData,
  tradeData: null,
  socket: null,
  // setTradeData: (data) => set({ tradeData: data }),
  connectSocket: async () => {
    // 이미 연결되어 있으면 새로 열지 않음
    const existing = get().socket;
    if (
      existing &&
      (existing.readyState === WebSocket.CONNECTING ||
        existing.readyState === WebSocket.OPEN)
    )
      return;

    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    // heartbeat 변수
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let pongTimeout: ReturnType<typeof setTimeout> | null = null;

    const startHeartbeat = () => {
      pingInterval = setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) return;

        // ping 전송
        socket.send(JSON.stringify({ type: "ping" }));

        // 10초 안에 pong 없으면 강제 재연결
        pongTimeout = setTimeout(() => {
          console.warn("pong 응답 없음 → 소켓 강제 종료 후 재연결");
          socket.close();
        }, 10000);
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (pingInterval) clearInterval(pingInterval);
      if (pongTimeout) clearTimeout(pongTimeout);
    };

    socket.onopen = () => {
      startHeartbeat();
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // pong 수신 시 타임아웃 취소
      if (data.type === "pong") {
        if (pongTimeout) clearTimeout(pongTimeout);
        return;
      }

      if (data.type === "filled") {
        toast.success(data.message ?? "주문 체결!");
        set({ shouldRefresh: true });
        invalidateAll();
        return;
      }
      if (data.type === "liquidated") {
        toast.error(data.message ?? "포지션이 강제청산됐어요!");
        set({ shouldRefresh: true });
        invalidateAll();
        return;
      }
      if (data.type === "ordered") {
        toast.success(data.message ?? "주문 등록!");
        set({ shouldRefresh: true });
        invalidateAll();
        return;
      }
      if (data.type === "funding") {
        toast(data.message ?? "펀딩비가 적용됐어요!", {
          icon: "💰",
        });
        set({ shouldRefresh: true });
        invalidateAll();
        return;
      }

      if (data.type === "체결가") {
        set({ tradeData: data });
      }
      if (data.type === "호가창") {
        set({ depthData: data });
      }
    };

    socket.onclose = () => {
      console.log("소켓 끊김, 재연결...");
      stopHeartbeat(); // 재연결 전 heartbeat 정리
      set({ socket: null, lastDisconnectedAt: Date.now() });
      setTimeout(() => {
        // socket이 null일 때만 재연결 (의도적 종료 아닐 때)
        if (get().socket !== null) return;
        get().connectSocket();
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("소켓 오류:", JSON.stringify(err), err);
    };

    set({ socket });
  },

  disconnectSocket: () => {
    get().socket?.close();
    set({ socket: null });
  },
  authStatus: "loading",
  setAuthStatus: (status) => set({ authStatus: status }),
  shouldRefresh: false,
  setShouldRefresh: (v: boolean) => set({ shouldRefresh: v }),
  // setDepthData: (data: DepthData) => set({ depthData: data }),
  // setTradeData: (data: TradeData) => set({ tradeData: data }),
}));
