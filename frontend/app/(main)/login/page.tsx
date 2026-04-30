"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (isRegister && !nickname) {
      setMessage("닉네임을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const url = isRegister
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isRegister ? { email, password, nickname } : { email, password },
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message ?? "오류가 발생했어요.");
        return;
      }

      if (isRegister) {
        setMessage("회원가입 성공! 로그인해주세요.");
        setIsRegister(false);
        setEmail("");
        setPassword("");
        setNickname("");
      } else {
        // 닉네임 저장 (표시용)
        localStorage.setItem("nickname", data.nickname);
        router.replace("/future");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
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
        router.replace("/future");
      }
    } catch {
      setMessage("게스트 로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-900 min-h-screen">
      <div className="w-full max-w-sm bg-gray-800 rounded-xl p-8 flex flex-col gap-5">
        {/* 타이틀 */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold">BIT HAMA</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isRegister ? "회원가입" : "로그인"}
          </p>
        </div>

        {/* 닉네임 (회원가입만) */}
        {isRegister && (
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              onKeyDown={handleKeyDown}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* 이메일 */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이메일 입력"
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 비밀번호 */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="비밀번호 입력"
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          {/* 회원가입 시에만 안내 표시 */}
          {isRegister && (
            <p className="text-gray-600 text-xs">
              8자 이상, 영문+숫자 조합으로 입력해주세요
            </p>
          )}
        </div>
        {/* 메시지 */}
        {message && (
          <p
            className={`text-xs text-center ${
              message.includes("성공") ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        {/* 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "처리중..." : isRegister ? "회원가입" : "로그인"}
        </button>
        {/* 게스트 로그인 */}
        {!isRegister && (
          <>
            {/* 구분선 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-600 text-xs">또는</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* 게스트 안내 */}
            <p className="text-center text-gray-500 text-xs">
              게스트는 일회용 계정이에요. 10만 USDT가 자동으로 지급돼요.
            </p>

            {/* 게스트 로그인 */}
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full py-3 rounded font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              게스트로 시작하기
            </button>
          </>
        )}
        {/* 전환 */}
        <p className="text-center text-gray-400 text-xs">
          {isRegister ? "이미 계정이 있나요?" : "계정이 없나요?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
            className="text-blue-400 hover:text-blue-300 ml-1"
          >
            {isRegister ? "로그인" : "회원가입"}
          </button>
        </p>
      </div>
    </div>
  );
}
