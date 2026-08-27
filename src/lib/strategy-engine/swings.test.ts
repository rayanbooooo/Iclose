import { describe, expect, it } from "vitest";

import { detectSwingPoints } from "./swings";
import type { Candle } from "./types";

function bar(time: number, high: number, low: number): Candle {
  const close = (high + low) / 2;
  return { time, open: close, high, low, close };
}

describe("detectSwingPoints", () => {
  it("finds alternating fractal highs and lows with lookback=1", () => {
    const candles: Candle[] = [
      bar(0, 100, 95),
      bar(1, 105, 98),
      bar(2, 110, 100), // swing HIGH
      bar(3, 108, 97),
      bar(4, 106, 90), // swing LOW
      bar(5, 109, 96),
      bar(6, 115, 101), // swing HIGH
      bar(7, 112, 99),
      bar(8, 108, 95), // swing LOW
      bar(9, 110, 97),
    ];

    const swings = detectSwingPoints(candles, 1);

    expect(swings).toEqual([
      { type: "HIGH", pivotIndex: 2, time: 2, price: 110, confirmedAtIndex: 3 },
      { type: "LOW", pivotIndex: 4, time: 4, price: 90, confirmedAtIndex: 5 },
      { type: "HIGH", pivotIndex: 6, time: 6, price: 115, confirmedAtIndex: 7 },
      { type: "LOW", pivotIndex: 8, time: 8, price: 95, confirmedAtIndex: 9 },
    ]);
  });

  it("requires a strictly higher/lower pivot — ties disqualify a bar", () => {
    const candles: Candle[] = [bar(0, 100, 90), bar(1, 100, 90), bar(2, 95, 92)];
    expect(detectSwingPoints(candles, 1)).toEqual([]);
  });

  it("returns nothing when there aren't enough bars for the lookback window", () => {
    const candles: Candle[] = [bar(0, 100, 90), bar(1, 105, 95)];
    expect(detectSwingPoints(candles, 5)).toEqual([]);
  });
});
