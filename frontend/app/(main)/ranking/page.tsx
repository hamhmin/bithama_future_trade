"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/component/common/I18nProvider";

type RankingRow = {
  rank: number;
  userId: number;
  nickname: string;
  isGuest: boolean;
  totalEquity: number;
  totalBalance: number;
  availableBalance: number;
  lockedMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  profitRate: number;
  openPositionCount: number;
  closedPositionCount: number;
  filledOrderCount: number;
  winRate: number;
  joinedAt: string;
};

type RankingResponse = {
  latestPrice: number;
  rankings: RankingRow[];
};

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function RankingPage() {
  const { translate } = useI18n();
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<"all" | "member" | "guest">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ranking`,
          { credentials: "include" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "랭킹 로딩 실패");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "랭킹 로딩 실패");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const rows = useMemo(() => {
    const rankings = data?.rankings ?? [];
    if (scope === "member") return rankings.filter((row) => !row.isGuest);
    if (scope === "guest") return rankings.filter((row) => row.isGuest);
    return rankings;
  }, [data, scope]);

  const topThree = rows.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#050d1a] text-white px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-gray-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/future"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {translate("거래소")} / BITHAMA
            </Link>
            <h1 className="mt-2 text-3xl font-bold">
              {translate("랭킹")}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {translate("게스트를 포함한 전체 회원 순위를 확인하세요.")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{translate("BTC 현재가")}</span>
            <span className="font-bold text-white">
              {formatNumber(data?.latestPrice ?? 0)} USDT
            </span>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "전체"],
            ["member", "회원"],
            ["guest", "게스트"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScope(key as "all" | "member" | "guest")}
              className={`h-9 rounded border px-4 text-sm transition-colors ${
                scope === key
                  ? "border-blue-500 bg-blue-500/15 text-blue-300"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              {translate(label)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            {translate("랭킹 로딩 중...")}
          </div>
        ) : error ? (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              {topThree.map((row) => (
                <div
                  key={row.userId}
                  className="rounded border border-gray-800 bg-gray-900/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-300">
                      #{row.rank}
                    </span>
                    <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400">
                      {translate(row.isGuest ? "게스트" : "회원")}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-lg font-bold">
                    {row.nickname}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {translate("총 자산")}
                  </p>
                  <p className="text-xl font-bold">
                    {formatNumber(row.totalEquity)} USDT
                  </p>
                  <p
                    className={`mt-2 text-sm ${
                      row.profitRate >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {row.profitRate >= 0 ? "+" : ""}
                    {formatNumber(row.profitRate)}%
                  </p>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-gray-900 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">{translate("순위")}</th>
                      <th className="px-4 py-3 text-left">{translate("닉네임")}</th>
                      <th className="px-4 py-3 text-left">{translate("구분")}</th>
                      <th className="px-4 py-3 text-right">{translate("총 자산")}</th>
                      <th className="px-4 py-3 text-right">{translate("수익률")}</th>
                      <th className="px-4 py-3 text-right">{translate("실현 손익")}</th>
                      <th className="px-4 py-3 text-right">{translate("미실현 손익")}</th>
                      <th className="px-4 py-3 text-right">{translate("승률")}</th>
                      <th className="px-4 py-3 text-right">{translate("거래 수")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map((row) => (
                      <tr key={row.userId} className="hover:bg-gray-900/50">
                        <td className="px-4 py-3 font-bold">#{row.rank}</td>
                        <td className="px-4 py-3">{row.nickname}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {translate(row.isGuest ? "게스트" : "회원")}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {formatNumber(row.totalEquity)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right ${
                            row.profitRate >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {row.profitRate >= 0 ? "+" : ""}
                          {formatNumber(row.profitRate)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(row.realizedPnl)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(row.unrealizedPnl)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(row.winRate)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.filledOrderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
