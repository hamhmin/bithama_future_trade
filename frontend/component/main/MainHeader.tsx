"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LanguageSwitcher from "@/component/main/LanguageSwitcher";
import {
  defaultLocale,
  getDictionary,
  getLocalePath,
  type LandingDictionary,
  type Locale,
} from "@/lib/i18n";

export default function MainHeader({
  locale = defaultLocale,
  dictionary,
}: {
  locale?: Locale;
  dictionary?: LandingDictionary["header"];
}) {
  const labels = dictionary ?? getDictionary(locale).header;
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { credentials: "include" },
        );
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsLoggedIn(false);
    router.refresh();
    router.push(getLocalePath(locale));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050d1a]/90 backdrop-blur-md border-b border-[#1e3a5f]/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <Link href={getLocalePath(locale)} className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
            BITHAMA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <Link href="/future" className="hover:text-white transition-colors">
            {labels.exchange}
          </Link>
          <Link href="#features" className="hover:text-white transition-colors">
            {labels.features}
          </Link>
          <Link href="#about" className="hover:text-white transition-colors">
            {labels.about}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher locale={locale} label={labels.language} />
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="hidden sm:inline text-sm text-gray-400 hover:text-white transition-colors"
              >
                {nickname}
              </Link>
              <Link
                href="/future"
                className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity"
              >
                {labels.startTrading}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline px-3 py-2 rounded-lg text-sm text-gray-400 border border-[#1e3a5f] hover:border-sky-500/50 hover:text-white transition-colors"
              >
                {labels.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                {labels.login}
              </Link>
              <Link
                href="/login"
                className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity"
              >
                {labels.start}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
