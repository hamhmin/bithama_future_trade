"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFutureStore } from "@/store/useFutureStore";

type Mode = "select" | "login" | "register";

export default function GuestModal({
  onClose,
  initialMode = "select",
}: {
  onClose: () => void;
  initialMode?: "select" | "login" | "register";
}) {
  const router = useRouter();
  const setAuthStatus = useFutureStore((state) => state.setAuthStatus);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setAuthStatus("logged-in");
        onClose();
      } else {
        setMessage(data.message ?? "로그인 실패");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async () => {
    if (!email || !password || !nickname) {
      setMessage("모든 항목을 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, nickname }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        // 회원가입 성공 후 자동 로그인
        const loginRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          },
        );
        if (loginRes.ok) {
          setAuthStatus("logged-in");
          onClose();
        }
      } else {
        setMessage(data.message ?? "회원가입 실패");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };

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
        setAuthStatus("logged-in");
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
        className="bg-gray-800 rounded-xl p-6 w-72 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg text-center">BIT HAMA</h3>

        {mode === "select" ? (
          <>
            <p className="text-gray-400 text-sm text-center">
              로그인하고 모의 선물거래를 시작해보세요!
            </p>
            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className="w-full py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              로그인
            </button>
            <button
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              className="w-full py-2 rounded font-bold text-gray-300 border border-gray-600 hover:border-gray-400 transition-colors"
            >
              회원가입
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
            <p className="text-gray-600 text-xs text-center">
              게스트는 일회용 계정이에요
              <br />
              10만 USDT가 자동으로 지급돼요
            </p>
          </>
        ) : mode === "login" ? (
          <>
            <button
              onClick={() => {
                setMode("select");
                setMessage("");
              }}
              className="text-gray-500 text-xs hover:text-gray-300 text-left w-fit"
            >
              ← 뒤로
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="이메일 입력"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="비밀번호 입력"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {message && (
              <p className="text-red-400 text-xs text-center">{message}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setMode("select");
                setMessage("");
              }}
              className="text-gray-500 text-xs hover:text-gray-300 text-left w-fit"
            >
              ← 뒤로
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                placeholder="닉네임 입력"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                placeholder="이메일 입력"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                placeholder="8자 이상, 영문+숫자"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {message && (
              <p className="text-red-400 text-xs text-center">{message}</p>
            )}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "처리중..." : "회원가입"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
