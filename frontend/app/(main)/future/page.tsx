import FutureHeader from "@/component/future/FutureHeader";
import PositionPanel from "@/component/future/PositionPanel";
import TradeInfo from "@/component/future/TradeInfo";
import OrderBook from "@/component/future/OrderBook";
import OrderPanel from "@/component/future/OrderPanel";
import TradingChart from "@/component/future/TradingChart";
import SocketProvider from "@/component/future/SocketProvider";
import { useFutureStore } from "@/store/useFutureStore";

async function getInitialData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/future/initial-data`,
      { cache: "no-store" },
    );
    return await res.json();
  } catch {
    return {
      depth: { type: "호가창", bids: [], asks: [] },
      trade: null,
    };
  }
}

export default async function FuturePage() {
  const { depth, trade } = await getInitialData();
  console.log(depth, trade);

  // 서버에서 store 초기값 설정
  if (depth) useFutureStore.setState({ depthData: depth });
  if (trade) useFutureStore.setState({ tradeData: trade });
  return (
    <div
      className="
      h-screen bg-[#050d1a] text-white
      grid grid-cols-12
      grid-rows-[48px_1fr_200px]
    "
    >
      {/* 소켓 여는 컴포넌트 */}
      <SocketProvider />

      {/* 헤더 */}
      <div className="col-span-12 border-b border-gray-700">
        <FutureHeader initialTrade={trade} />
      </div>

      {/* 차트 */}
      <div className="col-span-7 border-r border-gray-700">
        <TradingChart />
      </div>

      {/* 호가창 - 2행 차지 */}
      <div className="col-span-2 border-r border-gray-700 overflow-hidden">
        <OrderBook initialDepth={depth} initialTrade={trade} />
      </div>

      {/* 주문패널 */}
      <div className="col-span-3 ">
        <OrderPanel />
      </div>

      {/* 포지션 */}
      <div className="col-span-9   border-t border-r border-gray-700">
        <PositionPanel />
      </div>

      {/* 거래정보 */}
      <div className="col-span-3 border-t border-gray-700">
        <TradeInfo />
      </div>
    </div>
  );
}
