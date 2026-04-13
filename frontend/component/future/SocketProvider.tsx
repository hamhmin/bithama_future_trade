"use client";

import { useEffect } from "react";
import { useFutureStore } from "@/store/useFutureStore";

export default function SocketProvider() {
  const { connectSocket, disconnectSocket, tradeData } = useFutureStore();
  const price = tradeData ? parseFloat(tradeData.price).toFixed(2) : 0;
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);

  useEffect(() => {
    document.title = !tradeData?.price
      ? "0"
      : `$${parseFloat(tradeData.price).toLocaleString()} | BTCUSDT with bithama`;
  }, [price]);

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

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return null;
}
