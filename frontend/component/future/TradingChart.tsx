"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { useFutureStore } from "@/store/useFutureStore";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { fetchPositions, fetchOrders } from "@/lib/queries";

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
  takeProfit: number | null;
  stopLoss: number | null;
};

type Order = {
  id: number;
  side: string;
  price: number | null;
  type: string;
};

const TradingChart = ({ initialCandles = [] }: { initialCandles?: any[] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInterval, setChartInterval] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_interval");
      if (saved) {
        // 저장된 라벨과 일치하는 INTERVALS 객체를 찾습니다.
        return INTERVALS.find((iv) => iv.label === saved) || INTERVALS[0];
      }
    }
    return INTERVALS[0];
  });
  const tradeData = useFutureStore((state) => state.tradeData);
  const candleSeriesRef = useRef<any>(null);
  const currentCandleRef = useRef<any>(null);
  const priceLineRefs = useRef<any[]>([]);
  const authStatus = useFutureStore((state) => state.authStatus);
  const isInitialLoadedRef = useRef(false); // 🔑 핵심 플래그
  const isLoadingMoreRef = useRef(false); // 스크롤 중복 방지
  const lastDisconnectedAt = useFutureStore(
    (state) => state.lastDisconnectedAt,
  );
  const setLastDisconnectedAt = useFutureStore(
    (state) => state.setLastDisconnectedAt,
  );
  const socket = useFutureStore((state) => state.socket);

  // fetchLines 제거 → useQuery로 교체
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: QUERY_KEYS.positions,
    queryFn: fetchPositions,
    enabled: authStatus === "logged-in",
    staleTime: 0,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: QUERY_KEYS.orders,
    queryFn: fetchOrders,
    enabled: authStatus === "logged-in",
    staleTime: 0,
  });

  // socket이 새로 연결되고 끊긴 시간이 있으면 캔들 보완
  useEffect(() => {
    if (!socket || !lastDisconnectedAt || !candleSeriesRef.current) return;

    const fillGapCandles = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/candles?symbol=BTCUSDT&interval=${chartInterval.label}`,
        );
        const candles = await res.json();
        const formatted = candles.map((c: any) => ({
          time: Math.floor(c.openTime / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        // 끊긴 구간 이후 캔들만 update
        const disconnectTime = Math.floor(lastDisconnectedAt / 1000);
        const newCandles = formatted.filter(
          (c: any) => c.time >= disconnectTime,
        );
        newCandles.forEach((c: any) => candleSeriesRef.current?.update(c));

        setLastDisconnectedAt(null); // 처리 완료 후 초기화
      } catch (err) {
        console.error("캔들 보완 실패:", err);
      }
    };

    fillGapCandles();
  }, [socket]); // socket 객체가 바뀔 때(재연결) 실행

  // 차트 초기화
  useEffect(() => {
    if (!chartContainerRef.current) return;

    isInitialLoadedRef.current = false; // 인터벌 바뀌면 플래그 초기화

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: { background: { color: "#111827" }, textColor: "#9ca3af" },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          // UTC+9 직접 변환
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const yyyy = kstDate.getUTCFullYear();
          const mm = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(kstDate.getUTCDate()).padStart(2, "0");
          const hh = String(kstDate.getUTCHours()).padStart(2, "0");
          const min = String(kstDate.getUTCMinutes()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date((time + 9 * 60 * 60) * 1000);
          const hh = String(date.getUTCHours()).padStart(2, "0");
          const min = String(date.getUTCMinutes()).padStart(2, "0");
          return `${hh}:${min}`;
        },
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
    priceLineRefs.current = [];

    const formatCandles = (candles: any[]) =>
      candles.map((c: any) => ({
        time: Math.floor(c.openTime / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    const loadInitialCandles = async () => {
      try {
        let formatted: any[] = [];

        // SSR 데이터 있고 1m 첫 진입이면 바로 사용
        if (initialCandles.length > 0 && chartInterval.label === "1m") {
          formatted = formatCandles(initialCandles);
        } else {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/candles?symbol=BTCUSDT&interval=${chartInterval.label}`,
          );
          const candles = await res.json();
          formatted = formatCandles(candles);
        }

        candleSeries.setData(formatted);
        chart.timeScale().fitContent();

        if (formatted.length > 0) {
          currentCandleRef.current = formatted[formatted.length - 1];
        }
      } catch (err) {
        console.error("초기 캔들 로딩 실패:", err);
      } finally {
        isInitialLoadedRef.current = true; // 성공/실패 무관하게 완료 처리
      }
    };

    loadInitialCandles();

    // 스크롤 왼쪽 끝 도달 시 추가 캔들 로딩
    const handleRangeChange = async () => {
      if (isLoadingMoreRef.current) return;
      const range = chart.timeScale().getVisibleLogicalRange();
      if (!range || range.from > 5) return;

      const currentData = candleSeriesRef.current?.data?.();
      if (!currentData || currentData.length === 0) return;

      isLoadingMoreRef.current = true;
      try {
        const oldest = currentData[0];
        const beforeTime = oldest.time * 1000;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/candles?symbol=BTCUSDT&interval=${chartInterval.label}&before=${beforeTime}`,
        );
        const moreCandles = await res.json();
        if (moreCandles.length === 0) return;

        const formatted = formatCandles(moreCandles);

        // 중복 제거 + 시간순 정렬
        const merged = [...formatted, ...currentData];
        const deduped = Array.from(
          new Map(merged.map((c: any) => [c.time, c])).values(),
        ).sort((a: any, b: any) => a.time - b.time);

        candleSeriesRef.current.setData(deduped);
      } catch (err) {
        console.error("추가 캔들 로딩 실패:", err);
      } finally {
        isLoadingMoreRef.current = false;
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

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
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      window.removeEventListener("resize", handleResize);
      chart.remove();
      candleSeriesRef.current = null;
      priceLineRefs.current = [];
    };
  }, [chartInterval]);

  // tradeData 업데이트 시 캔들 갱신 — 플래그 체크 추가
  useEffect(() => {
    if (!tradeData || !candleSeriesRef.current) return;
    if (!isInitialLoadedRef.current) return; // 🔑 로딩 완료 전 무시

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

  // 포지션/주문 라인 그리기 (기존 코드 그대로)
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    priceLineRefs.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch {}
    });
    priceLineRefs.current = [];

    positions.forEach((pos) => {
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === "long" ? "#22c55e" : "#ef4444",
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${pos.side === "long" ? "Long" : "Short"} ${pos.leverage}x 진입가`,
      });
      priceLineRefs.current.push(entryLine);

      const liqLine = candleSeriesRef.current.createPriceLine({
        price: pos.liquidationPrice,
        color: "#f97316",
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: `${pos.side === "long" ? "Long" : "Short"} ${pos.leverage}x 청산가`,
      });
      priceLineRefs.current.push(liqLine);

      if (pos.takeProfit) {
        const tpLine = candleSeriesRef.current.createPriceLine({
          price: pos.takeProfit,
          color: "#22c55e",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "TP",
        });
        priceLineRefs.current.push(tpLine);
      }

      if (pos.stopLoss) {
        const slLine = candleSeriesRef.current.createPriceLine({
          price: pos.stopLoss,
          color: "#ef4444",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "SL",
        });
        priceLineRefs.current.push(slLine);
      }
    });

    orders.forEach((order) => {
      if (!order.price) return;
      const orderLine = candleSeriesRef.current.createPriceLine({
        price: order.price,
        color: order.side === "long" ? "#60a5fa" : "#f87171",
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `${order.side === "long" ? "Long" : "Short"} 지정가`,
      });
      priceLineRefs.current.push(orderLine);
    });
  }, [positions, orders]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* 인터벌 선택 버튼 */}
      <div className="flex gap-1 px-2 py-1 border-b border-gray-700">
        {INTERVALS.map((iv) => (
          <button
            key={iv.label}
            onClick={() => {
              setChartInterval(iv);
              localStorage.setItem("selected_interval", iv.label); // 로컬 스토리지에 저장
            }}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              chartInterval.label === iv.label
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {iv.label}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  );
};

export default React.memo(TradingChart);
