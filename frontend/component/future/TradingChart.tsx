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

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInterval, setChartInterval] = useState(INTERVALS[0]);
  const tradeData = useFutureStore((state) => state.tradeData);
  const candleSeriesRef = useRef<any>(null);
  const currentCandleRef = useRef<any>(null);

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

    // DB에서 초기 캔들 데이터 가져오기
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
