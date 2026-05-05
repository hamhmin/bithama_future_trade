const API = process.env.NEXT_PUBLIC_API_URL;

export const fetchPositions = async () => {
  const res = await fetch(`${API}/api/future/positions`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("포지션 로딩 실패");
  return res.json();
};

export const fetchOrders = async () => {
  const res = await fetch(`${API}/api/future/orders`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("주문 로딩 실패");
  return res.json();
};

export const fetchMe = async () => {
  const res = await fetch(`${API}/api/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("유저 로딩 실패");
  return res.json();
};

export const fetchAssets = async () => {
  const res = await fetch(`${API}/api/future/assets`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("자산 로딩 실패");
  return res.json();
};

export const fetchSetting = async () => {
  const res = await fetch(`${API}/api/future/setting`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("설정 로딩 실패");
  return res.json();
};
