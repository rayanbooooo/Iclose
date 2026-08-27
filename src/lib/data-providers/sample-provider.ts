import type { Candle } from "@/lib/strategy-engine/types";

/**
 * SAMPLE DATA ONLY — not real MNQ market data. Deterministically generated
 * (seeded PRNG) so the chart looks the same on every request rather than
 * reshuffling on each page load. Real market data is Phase 3, gated on
 * picking a data vendor; this exists purely to exercise the strategy engine
 * and chart end-to-end.
 */

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundToTick(price: number, tick = 0.25) {
  return Math.round(price / tick) * tick;
}

export interface SampleDataOptions {
  bars?: number;
  startPrice?: number;
  timeframeMinutes?: number;
  seed?: number;
  /** Unix seconds for the most recent candle's open time. Defaults to now, floored to the timeframe. */
  endTime?: number;
}

export function generateSampleCandles(options: SampleDataOptions = {}): Candle[] {
  const {
    bars = 320,
    startPrice = 21000,
    timeframeMinutes = 15,
    seed = 20260827,
    endTime,
  } = options;

  const random = mulberry32(seed);
  const stepSeconds = timeframeMinutes * 60;
  const lastOpenTime = Math.floor((endTime ?? Math.floor(Date.now() / 1000)) / stepSeconds) * stepSeconds;
  const firstOpenTime = lastOpenTime - (bars - 1) * stepSeconds;

  const candles: Candle[] = [];
  let price = startPrice;
  // Momentum bias drives multi-bar trends (so the fractal detector finds
  // real structure) instead of pure noise, which rarely forms clean swings.
  let momentum = 0;

  for (let i = 0; i < bars; i++) {
    const time = firstOpenTime + i * stepSeconds;

    // Occasionally flip/refresh the trend bias.
    if (random() < 0.12) {
      momentum = (random() - 0.5) * 18;
    }

    const noise = (random() - 0.5) * 14;
    const drift = momentum * 0.6 + noise;

    const open = price;
    const close = roundToTick(open + drift);
    const wick = Math.abs(drift) * (0.3 + random() * 0.6) + random() * 4;
    const high = roundToTick(Math.max(open, close) + wick * random());
    const low = roundToTick(Math.min(open, close) - wick * random());
    const volume = Math.round(400 + random() * 1600);

    candles.push({ time, open, high, low, close, volume });
    price = close;
  }

  return candles;
}
