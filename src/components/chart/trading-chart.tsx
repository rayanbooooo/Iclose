"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";

import type { Candle, StrategySignal, SwingPoint } from "@/lib/strategy-engine/types";

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";
const SWING_HIGH_COLOR = "#a78bfa";
const SWING_LOW_COLOR = "#38bdf8";

interface TradingChartProps {
  candles: Candle[];
  swingPoints: SwingPoint[];
  signals: StrategySignal[];
}

export function TradingChart({ candles, swingPoints, signals }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a8a8bd",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(148, 130, 255, 0.06)" },
        horzLines: { color: "rgba(148, 130, 255, 0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(148, 130, 255, 0.12)" },
      timeScale: {
        borderColor: "rgba(148, 130, 255, 0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    for (const swing of swingPoints) {
      const startIndex = candles.findIndex((c) => c.time === swing.time);
      if (startIndex === -1) continue;
      const endIndex = swing.resolvedAtIndex ?? candles.length - 1;
      if (endIndex <= startIndex) continue;

      const lineSeries = chart.addSeries(LineSeries, {
        color: swing.type === "HIGH" ? SWING_HIGH_COLOR : SWING_LOW_COLOR,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      lineSeries.setData(
        candles
          .slice(startIndex, endIndex + 1)
          .map((c) => ({ time: c.time as UTCTimestamp, value: swing.price })),
      );
    }

    createSeriesMarkers(
      candleSeries,
      signals.map((signal) => ({
        time: signal.time as UTCTimestamp,
        position: signal.direction === "LONG" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: signal.direction === "LONG" ? ("arrowUp" as const) : ("arrowDown" as const),
        color: signal.direction === "LONG" ? UP_COLOR : DOWN_COLOR,
        text: `${signal.direction} ${signal.kind === "BREAKOUT" ? "BO" : "RT"}`,
      })),
    );

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [candles, swingPoints, signals]);

  return <div ref={containerRef} className="h-[520px] w-full" />;
}
