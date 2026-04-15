import FutureHeader from "@/component/future/FutureHeader";
import PositionPanel from "@/component/future/PositionPanel";
import TradeInfo from "@/component/future/TradeInfo";
import OrderBook from "@/component/future/OrderBook";
import OrderPanel from "@/component/future/OrderPanel";
import TradingChart from "@/component/future/TradingChart";
import SocketProvider from "@/component/future/SocketProvider";

export default function FuturePage() {
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
        <FutureHeader />
      </div>

      {/* 차트 */}
      <div className="col-span-7 border-r border-gray-700">
        <TradingChart />
      </div>

      {/* 호가창 - 2행 차지 */}
      <div className="col-span-2 border-r border-gray-700 overflow-hidden">
        <OrderBook />
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
