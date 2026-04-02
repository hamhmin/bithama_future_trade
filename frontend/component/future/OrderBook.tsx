"use client";

const DUMMY_ASKS = [
  { price: "67,100.00", size: "0.234" },
  { price: "67,050.00", size: "1.123" },
  { price: "67,000.00", size: "0.456" },
  { price: "66,950.00", size: "2.341" },
  { price: "66,900.00", size: "0.789" },
];

const DUMMY_BIDS = [
  { price: "66,850.00", size: "1.234" },
  { price: "66,800.00", size: "0.567" },
  { price: "66,750.00", size: "3.456" },
  { price: "66,700.00", size: "0.123" },
  { price: "66,650.00", size: "2.789" },
];

export default function OrderBook() {
  return (
    <div className="w-full h-full flex flex-col text-xs">
      {/* 헤더 */}
      <div className="flex justify-between px-2 py-1 text-gray-500 border-b border-gray-700">
        <span>가격(USDT)</span>
        <span>수량(BTC)</span>
      </div>

      {/* 매도 호가 */}
      <div className="flex-1 flex flex-col-reverse overflow-hidden">
        {DUMMY_ASKS.map((ask, i) => (
          <div
            key={i}
            className="flex justify-between px-2 py-0.5 hover:bg-gray-800 relative"
          >
            <span className="text-red-400">{ask.price}</span>
            <span className="text-gray-300">{ask.size}</span>
          </div>
        ))}
      </div>

      {/* 현재가 */}
      <div className="flex items-center justify-center py-1 border-y border-gray-700 text-green-400 font-bold">
        66,870.00
      </div>

      {/* 매수 호가 */}
      <div className="flex-1 overflow-hidden">
        {DUMMY_BIDS.map((bid, i) => (
          <div
            key={i}
            className="flex justify-between px-2 py-0.5 hover:bg-gray-800"
          >
            <span className="text-green-400">{bid.price}</span>
            <span className="text-gray-300">{bid.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
