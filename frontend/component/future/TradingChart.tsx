"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { useFutureStore } from "@/store/useFutureStore";

const INTERVALS = [
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "30m", seconds: 1800 },
  { label: "1h", seconds: 3600 },
  { label: "4h", seconds: 14400 },
  { label: "1d", seconds: 86400 },
];

type Position = {
  id: number;
  side: string;
  entryPrice: number;
  liquidationPrice: number;
  leverage: number;
};

type Order = {
  id: number;
  side: string;
  price: number | null;
  type: string;
};

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInterval, setChartInterval] = useState(INTERVALS[0]);
  const tradeData = useFutureStore((state) => state.tradeData);
  const candleSeriesRef = useRef<any>(null);
  const currentCandleRef = useRef<any>(null);
  const priceLineRefs = useRef<any[]>([]);

  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // 포지션 + 주문 가져오기
  const fetchLines = async () => {
    try {
      const [posRes, ordRes] = await Promise.all([
        fetch("http://localhost:4000/api/future/positions", {
          credentials: "include",
        }),
        fetch("http://localhost:4000/api/future/orders", {
          credentials: "include",
        }),
      ]);
      if (posRes.ok) setPositions(await posRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch {
      // 비로그인이면 빈 배열 유지
    }
  };

  useEffect(() => {
    fetchLines();
    const interval = setInterval(fetchLines, 5000);
    return () => clearInterval(interval);
  }, []);

  // 차트 초기화
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candleSeriesRef.current = candleSeries;
    currentCandleRef.current = null;
    priceLineRefs.current = []; // 차트 새로 만들면 라인도 초기화

    const loadInitialCandles = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/candles?symbol=BTCUSDT&interval=${chartInterval.label}`,
        );
        const candles = await res.json();

        const formatted = candles.map((c: any) => ({
          time: Math.floor(c.openTime / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(formatted);
        chart.timeScale().fitContent();

        if (formatted.length > 0) {
          currentCandleRef.current = formatted[formatted.length - 1];
        }
      } catch (err) {
        console.error("초기 캔들 로딩 실패:", err);
      }
    };

    loadInitialCandles();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      candleSeriesRef.current = null;
      priceLineRefs.current = [];
    };
  }, [chartInterval]);

  // tradeData 업데이트 시 캔들 갱신
  useEffect(() => {
    if (!tradeData || !candleSeriesRef.current) return;

    const price = parseFloat(tradeData.price);
    const time =
      Math.floor(tradeData.time / 1000 / chartInterval.seconds) *
      chartInterval.seconds;

    const currentCandle = currentCandleRef.current;

    if (!currentCandle || currentCandle.time !== time) {
      currentCandleRef.current = {
        time,
        open: price,
        high: price,
        low: price,
        close: price,
      };
    } else {
      currentCandleRef.current = {
        ...currentCandle,
        high: Math.max(currentCandle.high, price),
        low: Math.min(currentCandle.low, price),
        close: price,
      };
    }

    candleSeriesRef.current.update(currentCandleRef.current);
  }, [tradeData]);

  // 포지션/주문 라인 그리기
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // 기존 라인 전부 제거
    priceLineRefs.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch {}
    });
    priceLineRefs.current = [];

    // 포지션 라인
    positions.forEach((pos) => {
      // 진입가 라인
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === "long" ? "#22c55e" : "#ef4444",
        lineWidth: 1,
        lineStyle: 0, // 실선
        axisLabelVisible: true,
        title: `${pos.side === "long" ? "Long" : "Short"} ${pos.leverage}x 진입가`,
      });
      priceLineRefs.current.push(entryLine);

      // 청산가 라인
      const liqLine = candleSeriesRef.current.createPriceLine({
        price: pos.liquidationPrice,
        color: "#f97316",
        lineWidth: 1,
        lineStyle: 3, // 점선
        axisLabelVisible: true,
        title: "청산가",
      });
      priceLineRefs.current.push(liqLine);
    });

    // 지정가 주문 라인
    orders.forEach((order) => {
      if (!order.price || order.type !== "limit") return;

      const orderLine = candleSeriesRef.current.createPriceLine({
        price: order.price,
        color: order.side === "long" ? "#86efac" : "#fca5a5",
        lineWidth: 1,
        lineStyle: 1, // 파선
        axisLabelVisible: true,
        title: `${order.side === "long" ? "Long" : "Short"} 주문`,
      });
      priceLineRefs.current.push(orderLine);
    });
  }, [positions, orders]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-1 p-2 border-b border-gray-700">
        {INTERVALS.map((i) => (
          <button
            key={i.label}
            onClick={() => setChartInterval(i)}
            className={`px-2 py-1 text-xs rounded ${
              chartInterval.label === i.label
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  );
}
