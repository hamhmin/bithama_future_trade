"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainHeader from "@/component/main/MainHeader";
import toast from "react-hot-toast";

type UserInfo = {
  id: number;
  email: string;
  nickname: string;
  wallet: {
    balance: number;
    locked: number;
  };
};

type Stats = {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  bestTrade: number;
  sumOfRoe: number;
  cumulativeRoe: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data);
        setNickname(data.nickname);
      } catch {
        router.push("/login");
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/future/stats`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) return;
        setStats(await res.json());
      } catch {}
    };

    fetchUser();
    fetchStats();
  }, []);

  const handleNicknameUpdate = async () => {
    if (!nickname) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ nickname }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("닉네임이 변경됐어요!");
        setUser((prev) => (prev ? { ...prev, nickname } : null));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("비밀번호가 변경됐어요!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="bg-[#050d1a] min-h-screen">
      <MainHeader />
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">프로필</h1>
          <p className="text-gray-400 mt-1">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 자산 현황 */}
          <div className="bg-[#0a1628] rounded-2xl p-6 border border-[#1e3a5f]/50">
            <h2 className="text-white font-bold text-lg mb-4">💰 자산 현황</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">가용 잔고</span>
                <span className="text-white font-bold">
                  {user.wallet?.balance.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">사용 중 증거금</span>
                <span className="text-white">
                  {user.wallet?.locked.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between border-t border-[#1e3a5f]/50 pt-3">
                <span className="text-gray-400">총 자산</span>
                <span className="text-white font-bold">
                  {(
                    (user.wallet?.balance ?? 0) + (user.wallet?.locked ?? 0)
                  ).toFixed(2)}{" "}
                  USDT
                </span>
              </div>
            </div>
          </div>

          {/* 거래 통계 */}
          <div className="bg-[#0a1628] rounded-2xl p-6 border border-[#1e3a5f]/50">
            <h2 className="text-white font-bold text-lg mb-4">📊 거래 통계</h2>
            {stats && stats.totalTrades > 0 ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">총 거래 횟수</span>
                  <span className="text-white">{stats.totalTrades}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">총 손익</span>
                  <span
                    className={
                      stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {stats.totalPnl >= 0 ? "+" : ""}
                    {stats.totalPnl.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">승률</span>
                  <span className="text-white">
                    {stats.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">매 거래 수익률 합산</span>
                  <span
                    className={
                      stats.sumOfRoe >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {stats.sumOfRoe >= 0 ? "+" : ""}
                    {stats.sumOfRoe.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">총 누적 수익률</span>
                  <span
                    className={
                      stats.cumulativeRoe >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {stats.cumulativeRoe >= 0 ? "+" : ""}
                    {stats.cumulativeRoe.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#1e3a5f]/50 pt-3">
                  <span className="text-gray-400">최고 수익 거래</span>
                  <span className="text-green-400">
                    +{stats.bestTrade.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">거래 내역이 없어요</p>
            )}
          </div>

          {/* 닉네임 변경 */}
          <div className="bg-[#0a1628] rounded-2xl p-6 border border-[#1e3a5f]/50">
            <h2 className="text-white font-bold text-lg mb-4">
              ✏️ 닉네임 변경
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-[#0f1f35] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleNicknameUpdate}
                disabled={loading}
                className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                변경하기
              </button>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-[#0a1628] rounded-2xl p-6 border border-[#1e3a5f]/50">
            <h2 className="text-white font-bold text-lg mb-4">
              🔒 비밀번호 변경
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="bg-[#0f1f35] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="bg-[#0f1f35] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handlePasswordUpdate}
                disabled={loading}
                className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                변경하기
              </button>
            </div>
          </div>
        </div>

        {/* 거래소 바로가기 */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/future")}
            className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity"
          >
            거래소 바로가기 →
          </button>
        </div>
      </div>
    </main>
  );
}
