"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

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
    // 현재 캔들 상태
    let currentCandle: any = null;

    // DB에서 초기 캔들 데이터 가져오기
    const loadInitialCandles = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/candles?symbol=BTCUSDT&interval=${chartInterval.label}`,
        );
        const candles = await res.json();
        console.log(candles);
        // lightweight-charts 형식으로 변환
        const formatted = candles.map((c: any) => ({
          time: Math.floor(c.openTime / 1000), // ms → s
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(formatted);
        chart.timeScale().fitContent();

        // 마지막 캔들 저장
        if (formatted.length > 0) {
          currentCandle = formatted[formatted.length - 1];
        }
      } catch (err) {
        console.error("초기 캔들 로딩 실패:", err);
      }
    };

    loadInitialCandles();

    const socket = new WebSocket("ws://localhost:4000");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.price);
      console.log(price);
      const time =
        Math.floor(data.time / 1000 / chartInterval.seconds) *
        chartInterval.seconds;

      if (!currentCandle || currentCandle.time !== time) {
        // 새 캔들 시작
        currentCandle = {
          time,
          open: price,
          high: price,
          low: price,
          close: price,
        };
      } else {
        // 기존 캔들 업데이트
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
      }

      candleSeries.update(currentCandle);
    };
    chart.timeScale().fitContent();

    // 리사이즈 대응
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
      socket.close();

      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartInterval]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* 봉 선택 버튼 */}
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

      {/* 차트 */}
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  );
}
