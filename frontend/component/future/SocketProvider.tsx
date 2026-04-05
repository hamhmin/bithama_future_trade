"use client";

import { useEffect } from "react";
import { useFutureStore } from "@/store/useFutureStore";

export default function SocketProvider() {
  const { connectSocket, disconnectSocket } = useFutureStore();

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return null;
}
