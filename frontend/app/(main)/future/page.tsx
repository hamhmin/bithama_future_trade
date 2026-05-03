import FutureClientLayout from "@/component/future/FutureClientLayout";
import { useFutureStore } from "@/store/useFutureStore";

async function getInitialData() {
  try {
    const [dataRes, candleRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/future/initial-data`, {
        cache: "no-store",
      }),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/candles?symbol=BTCUSDT&interval=1m`,
        { cache: "no-store" },
      ),
    ]);

    const data = await dataRes.json();
    const candles = await candleRes.json();

    return { ...data, candles };
  } catch {
    return {
      depth: { type: "호가창", bids: [], asks: [] },
      trade: null,
      candles: [],
    };
  }
}

export default async function FuturePage() {
  const { depth, trade, candles } = await getInitialData();
  // console.log(depth, trade);

  // 서버에서 store 초기값 설정
  if (depth) useFutureStore.setState({ depthData: depth });
  if (trade) useFutureStore.setState({ tradeData: trade });

  return (
    <FutureClientLayout depth={depth} trade={trade} initialCandles={candles} />
  );
}
