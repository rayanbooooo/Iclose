import { describe, expect, it } from "vitest";

import { DEFAULT_STRATEGY_CONFIG } from "./config";
import { generateSignals } from "./signals";
import type { Candle, SwingPoint } from "./types";

function bar(time: number, close: number, extra: Partial<Candle> = {}): Candle {
  return { time, open: close, high: close, low: close, close, ...extra };
}

describe("generateSignals", () => {
  it("fires an immediate short breakout when price closes below a swing low", () => {
    const swing: SwingPoint = { type: "LOW", pivotIndex: 0, time: 0, price: 100, confirmedAtIndex: 1 };
    const candles = [bar(0, 100), bar(1, 101), bar(2, 99)];

    const signals = generateSignals(candles, [swing], DEFAULT_STRATEGY_CONFIG);

    expect(signals).toEqual([
      { index: 2, time: 2, direction: "SHORT", kind: "BREAKOUT", price: 99, swingPoint: swing },
    ]);
  });

  it("waits for a multi-bar retest before confirming a long off a swing high", () => {
    const config = { ...DEFAULT_STRATEGY_CONFIG, confirmationBars: 2 };
    const swing: SwingPoint = { type: "HIGH", pivotIndex: 0, time: 0, price: 100, confirmedAtIndex: 1 };
    const candles = [
      bar(0, 100),
      bar(1, 105), // breaks above -> AWAITING_RETEST
      bar(2, 100, { low: 100 }), // touches the line, doesn't reclaim yet
      bar(3, 101), // 1st close back above
      bar(4, 102), // 2nd close back above -> confirms
    ];

    const signals = generateSignals(candles, [swing], config);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ index: 4, direction: "LONG", kind: "RETEST", price: 102 });
  });

  it("abandons the setup with no signal once expireAfterBars elapses without a retest", () => {
    const config = { ...DEFAULT_STRATEGY_CONFIG, expireAfterBars: 2 };
    const swing: SwingPoint = { type: "HIGH", pivotIndex: 0, time: 0, price: 100, confirmedAtIndex: 1 };
    const candles = [
      bar(0, 100),
      bar(1, 105, { low: 104 }), // breaks above, never comes near the line again
      bar(2, 106, { low: 105 }),
      bar(3, 107, { low: 105 }),
      bar(4, 108, { low: 105 }),
    ];

    expect(generateSignals(candles, [swing], config)).toEqual([]);
  });

  it("a decisive close back below the line during retest invalidates the setup", () => {
    const swing: SwingPoint = { type: "HIGH", pivotIndex: 0, time: 0, price: 100, confirmedAtIndex: 1 };
    const candles = [
      bar(0, 100),
      bar(1, 105), // breaks above
      bar(2, 99.8, { low: 99.8 }), // touches, then closes decisively below
    ];

    expect(generateSignals(candles, [swing], DEFAULT_STRATEGY_CONFIG)).toEqual([]);
  });

  it("mirrored rules are off by default and opt-in via config", () => {
    const swing: SwingPoint = { type: "HIGH", pivotIndex: 0, time: 0, price: 100, confirmedAtIndex: 1 };
    const candles = [bar(0, 100), bar(1, 95)];

    expect(generateSignals(candles, [swing], DEFAULT_STRATEGY_CONFIG)).toEqual([]);

    const mirrored = { ...DEFAULT_STRATEGY_CONFIG, mirroredEnabled: true };
    const signals = generateSignals(candles, [swing], mirrored);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ index: 1, direction: "SHORT", kind: "BREAKOUT" });
  });

  it("ignores a swing point before it's confirmed (no look-ahead)", () => {
    const swing: SwingPoint = { type: "LOW", pivotIndex: 3, time: 3, price: 100, confirmedAtIndex: 5 };
    // Close dips below the swing price before the swing is even confirmable —
    // must not fire, since that would be reacting to information from the future.
    const candles = [bar(0, 100), bar(1, 100), bar(2, 100), bar(3, 100), bar(4, 90)];

    expect(generateSignals(candles, [swing], DEFAULT_STRATEGY_CONFIG)).toEqual([]);
  });
});
