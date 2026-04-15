"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MainHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setNickname(data.nickname);
        }
      } catch {}
    };
    checkAuth();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsLoggedIn(false);
    router.refresh();
    router.push("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050d1a]/90 backdrop-blur-md border-b border-[#1e3a5f]/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
            BITHAMA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <Link href="/future" className="hover:text-white transition-colors">
            거래소
          </Link>
          <Link href="#features" className="hover:text-white transition-colors">
            기능
          </Link>
          <Link href="#about" className="hover:text-white transition-colors">
            소개
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {nickname}
              </Link>
              <Link
                href="/future"
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity"
              >
                거래 시작
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 border border-[#1e3a5f] hover:border-sky-500/50 hover:text-white transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity"
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
