"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFutureStore } from "@/store/useFutureStore";

export default function GuestModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    setLoading(true);
    const guestEmail = `guest_${Date.now()}@bithama.com`;
    const guestPassword = `guest_${Date.now()}`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword,
          nickname: `Guest_${Math.floor(Math.random() * 10000)}`,
        }),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: guestEmail, password: guestPassword }),
        },
      );

      if (res.ok) {
        setAuthStatus("logged-in"); // 전역으로 한 번에 변경
        onClose();
      }
    } catch {
      console.error("게스트 로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg">BIT HAMA</h3>
        <p className="text-gray-400 text-sm">
          로그인하고 모의 선물거래를 시작해보세요!
        </p>

        <button
          onClick={() => router.push("/login")}
          className="w-full py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          로그인 / 회원가입
        </button>

        <div className="flex items-center gap-2">
          <hr className="flex-1 border-gray-700" />
          <span className="text-gray-600 text-xs">또는</span>
          <hr className="flex-1 border-gray-700" />
        </div>

        <button
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-2 rounded font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "생성중..." : "게스트로 시작하기"}
        </button>

        <p className="text-gray-600 text-xs">
          게스트는 일회용 계정이에요
          <br />
          10만 USDT가 자동으로 지급돼요
        </p>
      </div>
    </div>
  );
}
