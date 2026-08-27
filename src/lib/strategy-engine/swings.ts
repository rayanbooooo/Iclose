import type { Candle, SwingPoint } from "./types";

/**
 * Detects N-bar fractal pivots: a bar whose high (low) is strictly the
 * highest (lowest) among the `lookbackPeriod` bars on each side of it.
 * A pivot at index i is only knowable once the bars through i+lookbackPeriod
 * have closed, which is recorded as `confirmedAtIndex` so downstream signal
 * logic never reacts to a swing before it could actually have existed.
 */
export function detectSwingPoints(candles: Candle[], lookbackPeriod: number): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let i = lookbackPeriod; i < candles.length - lookbackPeriod; i++) {
    const pivot = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
      if (j === i) continue;
      const other = candles[j];
      if (other.high >= pivot.high) isHigh = false;
      if (other.low <= pivot.low) isLow = false;
      if (!isHigh && !isLow) break;
    }

    if (isHigh) {
      swings.push({
        type: "HIGH",
        pivotIndex: i,
        time: pivot.time,
        price: pivot.high,
        confirmedAtIndex: i + lookbackPeriod,
      });
    }
    if (isLow) {
      swings.push({
        type: "LOW",
        pivotIndex: i,
        time: pivot.time,
        price: pivot.low,
        confirmedAtIndex: i + lookbackPeriod,
      });
    }
  }

  return swings.sort((a, b) => a.confirmedAtIndex - b.confirmedAtIndex);
}
