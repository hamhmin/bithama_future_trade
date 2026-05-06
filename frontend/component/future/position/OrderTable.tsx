"use client";

type Order = {
  id: number;
  side: string;
  type: string;
  price: number;
  size: number;
  leverage: number;
  margin: number;
  status: string;
  createdAt: string;
};

export default function OrderTable({
  orders,
  onCancel,
}: {
  orders: Order[];
  onCancel: (id: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
        미체결 주문이 없어요
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs whitespace-nowrap min-w-[800px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="px-3 py-2 text-left">심볼</th>
            <th className="px-3 py-2 text-left">방향</th>
            <th className="px-3 py-2 text-left">종류</th>
            <th className="px-3 py-2 text-right">주문가</th>
            <th className="px-3 py-2 text-right">수량</th>
            <th className="px-3 py-2 text-right">증거금</th>
            <th className="px-3 py-2 text-center">취소</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
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
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onCancel(order.id)}
                  className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-red-600 text-white transition-colors"
                >
                  취소
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
