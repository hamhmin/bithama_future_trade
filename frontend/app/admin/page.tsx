"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useI18n } from "@/component/common/I18nProvider";

type AdminUser = {
  id: number;
  email: string;
  nickname: string;
  isGuest: boolean;
  tutorialCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  wallet: {
    balance: number;
    locked: number;
    total: number;
    updatedAt: string;
  } | null;
  counts: {
    positions: number;
    orders: number;
    fundingHistories: number;
  };
};

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AdminPage() {
  const { translate } = useI18n();
  const [secret, setSecret] = useState("");
  const [savedSecret, setSavedSecret] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ email: "", nickname: "" });

  useEffect(() => {
    const value = localStorage.getItem("bithama_admin_secret") ?? "";
    setSecret(value);
    setSavedSecret(value);
  }, []);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": savedSecret,
    }),
    [savedSecret],
  );

  const loadUsers = useCallback(async () => {
    if (!savedSecret) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`,
        { headers: authHeaders },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? translate("회원 목록 로딩 실패"));
      setUsers(data.users);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : translate("회원 목록 로딩 실패"),
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders, query, savedSecret, translate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const saveSecret = () => {
    localStorage.setItem("bithama_admin_secret", secret);
    setSavedSecret(secret);
    toast.success(translate("관리자 키가 저장됐어요."));
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setDraft({ email: user.email, nickname: user.nickname });
  };

  const updateUser = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(draft),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? translate("회원 수정 실패"));
      toast.success(data.message ?? translate("회원 정보가 수정됐어요."));
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate("회원 수정 실패"));
    }
  };

  const resetWallet = async (id: number) => {
    if (!window.confirm(translate("지갑과 거래 기록을 초기화할까요?"))) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}/reset-wallet`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ balance: 100000 }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? translate("초기화 실패"));
      toast.success(data.message ?? translate("초기화됐어요."));
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate("초기화 실패"));
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm(translate("회원을 영구 삭제할까요?"))) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`,
        { method: "DELETE", headers: authHeaders },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? translate("삭제 실패"));
      toast.success(data.message ?? translate("회원이 삭제됐어요."));
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate("삭제 실패"));
    }
  };

  return (
    <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-gray-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/future"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              BITHAMA
            </Link>
            <h1 className="mt-2 text-3xl font-bold">관리자</h1>
            <p className="mt-1 text-sm text-gray-400">
              회원 검색, 정보 수정, 지갑 초기화, 삭제를 관리합니다.
            </p>
          </div>
          <Link
            href="/ranking"
            className="h-9 rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
          >
            랭킹 보기
          </Link>
        </header>

        <section className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="ADMIN_SECRET"
            className="h-10 rounded border border-gray-700 bg-gray-900 px-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={saveSecret}
            className="h-10 rounded bg-blue-600 px-4 text-sm font-bold hover:bg-blue-500"
          >
            관리자 키 저장
          </button>
          <button
            onClick={loadUsers}
            disabled={!savedSecret || loading}
            className="h-10 rounded border border-gray-700 px-4 text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
          >
            새로고침
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded border border-gray-800 bg-gray-900/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold">회원 관리</h2>
              <p className="text-xs text-gray-500">
                최대 200명까지 최신 가입 순으로 조회합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && loadUsers()}
                placeholder="이메일 또는 닉네임 검색"
                className="h-9 w-64 rounded border border-gray-700 bg-gray-950 px-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={loadUsers}
                className="h-9 rounded bg-gray-700 px-4 text-sm hover:bg-gray-600"
              >
                검색
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b border-gray-800">
                  <th className="px-3 py-3 text-left">ID</th>
                  <th className="px-3 py-3 text-left">구분</th>
                  <th className="px-3 py-3 text-left">이메일</th>
                  <th className="px-3 py-3 text-left">닉네임</th>
                  <th className="px-3 py-3 text-right">잔고</th>
                  <th className="px-3 py-3 text-right">증거금</th>
                  <th className="px-3 py-3 text-right">포지션</th>
                  <th className="px-3 py-3 text-right">주문</th>
                  <th className="px-3 py-3 text-left">가입일</th>
                  <th className="px-3 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-gray-500">
                      회원이 없어요.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const editing = editingId === user.id;
                    return (
                      <tr key={user.id} className="hover:bg-gray-950/60">
                        <td className="px-3 py-3 text-gray-400">{user.id}</td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
                            {user.isGuest ? "게스트" : "회원"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {editing ? (
                            <input
                              value={draft.email}
                              onChange={(event) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  email: event.target.value,
                                }))
                              }
                              className="h-8 w-64 rounded border border-gray-700 bg-gray-950 px-2 text-xs outline-none focus:border-blue-500"
                            />
                          ) : (
                            user.email
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {editing ? (
                            <input
                              value={draft.nickname}
                              onChange={(event) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  nickname: event.target.value,
                                }))
                              }
                              className="h-8 w-40 rounded border border-gray-700 bg-gray-950 px-2 text-xs outline-none focus:border-blue-500"
                            />
                          ) : (
                            user.nickname
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(user.wallet?.balance ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(user.wallet?.locked ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {user.counts.positions}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {user.counts.orders}
                        </td>
                        <td className="px-3 py-3 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            {editing ? (
                              <>
                                <button
                                  onClick={() => updateUser(user.id)}
                                  className="rounded bg-blue-600 px-3 py-1 text-xs font-bold hover:bg-blue-500"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:border-gray-500"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(user)}
                                  className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:border-gray-500"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => resetWallet(user.id)}
                                  className="rounded border border-yellow-600/60 px-3 py-1 text-xs text-yellow-300 hover:border-yellow-400"
                                >
                                  초기화
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="rounded border border-red-700/70 px-3 py-1 text-xs text-red-300 hover:border-red-500"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
