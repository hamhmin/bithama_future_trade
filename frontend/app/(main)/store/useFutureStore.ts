import { create } from "zustand";

interface TradeData {
  price: string;
  quantity: string;
  time: number;
}

interface FutureStore {
  tradeData: TradeData | null;
  setTradeData: (data: TradeData) => void;
}

export const useFutureStore = create<FutureStore>((set) => ({
  tradeData: null,
  setTradeData: (data) => set({ tradeData: data }),
}));
