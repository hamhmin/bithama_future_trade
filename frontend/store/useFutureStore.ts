import { create } from "zustand";

interface TradeData {
  price: string;
  quantity: string;
  time: number;
}

interface FutureStore {
  tradeData: TradeData | null; //소켓에서 받은 최신 데이터
  // setTradeData: (data: TradeData) => void; //tradeData 바꾸는 함수
  socket: WebSocket | null; //열려있는 소켓 객체
  connectSocket: () => void; //소켓 여는 함수
  disconnectSocket: () => void; //소켓 닫는 함수
}

export const useFutureStore = create<FutureStore>((set, get) => ({
  tradeData: null,
  socket: null,
  // setTradeData: (data) => set({ tradeData: data }),
  connectSocket: () => {
    // 이미 연결되어 있으면 새로 열지 않음
    const existing = get().socket;
    if (existing && existing.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket("ws://localhost:4000");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      set({ tradeData: data });
    };

    socket.onclose = () => {
      console.log("소켓 끊김, 재연결...");
      setTimeout(() => get().connectSocket(), 3000);
    };

    socket.onerror = (err) => {
      console.error("소켓 오류:", err);
    };

    set({ socket });
  },

  disconnectSocket: () => {
    get().socket?.close();
    set({ socket: null });
  },
}));
