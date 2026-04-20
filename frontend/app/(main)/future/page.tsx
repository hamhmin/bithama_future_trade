import FutureClientLayout from "@/component/future/FutureClientLayout";
import { useFutureStore } from "@/store/useFutureStore";

async function getInitialData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/future/initial-data`,
      { cache: "no-store" },
    );
    return await res.json();
  } catch {
    return { depth: { type: "호가창", bids: [], asks: [] }, trade: null };
  }
}

export default async function FuturePage() {
  const { depth, trade } = await getInitialData();
  // console.log(depth, trade);

  // 서버에서 store 초기값 설정
  if (depth) useFutureStore.setState({ depthData: depth });
  if (trade) useFutureStore.setState({ tradeData: trade });

  return <FutureClientLayout depth={depth} trade={trade} />;
}
