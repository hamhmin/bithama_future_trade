"use client";

type Order = {
  id: number;
  side: string;
  type: string;
  price: number;
  size: number;
  margin: number;
  fee: number | null;
  feeType: string | null;
  createdAt: string;
};

export default function HistoryTable({ history }: { history: Order[] }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        거래내역이 없어요
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-700">
          <th className="px-3 py-2 text-left">심볼</th>
          <th className="px-3 py-2 text-left">방향</th>
          <th className="px-3 py-2 text-left">종류</th>
          <th className="px-3 py-2 text-right">체결가</th>
          <th className="px-3 py-2 text-right">수량</th>
          <th className="px-3 py-2 text-right">증거금</th>
          <th className="px-3 py-2 text-right">수수료</th>
          <th className="px-3 py-2 text-right">일시</th>
        </tr>
      </thead>
      <tbody>
        {history.map((order) => (
          <tr
            key={order.id}
            className="border-b border-gray-800 hover:bg-gray-800"
          >
            <td className="px-3 py-2 text-white">BTCUSDT</td>
            <td className="px-3 py-2">
              <span
                className={`font-bold ${
                  order.side === "long" ? "text-green-400" : "text-red-400"
                }`}
              >
                {order.side === "long" ? "Long" : "Short"}
              </span>
            </td>
            <td className="px-3 py-2 text-gray-400">
              {order.type === "limit" ? "지정가" : "시장가"}
              {order.feeType && (
                <span className="ml-1 text-gray-600">({order.feeType})</span>
              )}
            </td>
            <td className="px-3 py-2 text-right text-white">
              ${order.price?.toLocaleString() ?? "-"}
            </td>
            <td className="px-3 py-2 text-right text-white">
              {order.size} BTC
            </td>
            <td className="px-3 py-2 text-right text-white">
              ${order.margin.toFixed(2)}
            </td>
            <td className="px-3 py-2 text-right text-red-400">
              {order.fee != null ? `-$${order.fee.toFixed(4)}` : "-"}
            </td>
            <td className="px-3 py-2 text-right text-gray-400">
              {new Date(order.createdAt).toLocaleString("ko-KR")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
