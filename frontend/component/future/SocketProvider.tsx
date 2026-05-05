"use client";

import { useEffect } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import { useQueryClient } from "@tanstack/react-query"; // 추가
import { setQueryClient } from "@/store/useFutureStore"; // 추가

export default function SocketProvider() {
  const { connectSocket, disconnectSocket } = useFutureStore();
  const price = useFutureStore((state) =>
    state.tradeData ? parseFloat(state.tradeData.price).toFixed(2) : "0",
  );
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("setQueryClient 호출:", queryClient);

    setQueryClient(queryClient);
  }, [queryClient]);

  useEffect(() => {
    document.title =
      price === "0"
        ? "BITHAMA"
        : `$${parseFloat(price)
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} | BTCUSDT with bithama`;
  }, [price]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          setAuthStatus("logged-in");

          // 소켓에 userId 전송
          const socket = useFutureStore.getState().socket;
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "auth", userId: data.id }));
          } else {
            // 소켓 연결 전이면 연결 후 전송
            const interval = setInterval(() => {
              const s = useFutureStore.getState().socket;
              if (s && s.readyState === WebSocket.OPEN) {
                s.send(JSON.stringify({ type: "auth", userId: data.id }));
                clearInterval(interval);
              }
            }, 100);
          }
        } else {
          setAuthStatus("guest");
        }
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
