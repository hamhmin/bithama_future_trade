"use client";

import { useEffect } from "react";
import { useFutureStore } from "@/store/useFutureStore";

export default function SocketProvider() {
  const { connectSocket, disconnectSocket, tradeData } = useFutureStore();
  const price = tradeData ? parseFloat(tradeData.price).toFixed(2) : 0;

  useEffect(() => {
    document.title = !tradeData?.price
      ? "0"
      : `$${parseFloat(tradeData.price).toLocaleString()} | BTCUSDT with bithama`;
  }, [price]);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return null;
}
