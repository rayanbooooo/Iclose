export interface Candle {
  /** Unix seconds (candle open time). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type SwingType = "HIGH" | "LOW";

export interface SwingPoint {
  type: SwingType;
  /** Index into the candles array of the pivot bar itself. */
  pivotIndex: number;
  time: number;
  price: number;
  /**
   * Index at which this pivot became knowable — a fractal high/low can only be
   * confirmed once `lookbackPeriod` bars have closed on both sides of it, so
   * the state machine must not react to it before this index (avoids
   * look-ahead bias).
   */
  confirmedAtIndex: number;
  /** Index of the candle whose close resolved this line (breakout/retest/expiry), if any. */
  resolvedAtIndex?: number;
}

export type SignalDirection = "LONG" | "SHORT";
export type SignalKind = "BREAKOUT" | "RETEST";

export interface StrategySignal {
  /** Index into the candles array of the candle that triggered this signal. */
  index: number;
  time: number;
  direction: SignalDirection;
  kind: SignalKind;
  /** Close price of the triggering candle. */
  price: number;
  swingPoint: SwingPoint;
}

export interface StrategyConfig {
  /** Bars required on each side of a bar for it to qualify as a fractal pivot. */
  lookbackPeriod: number;
  /** How close (as % of price) a candle must come back to a broken line to count as a retest touch. */
  retestTolerancePct: number;
  /** Consecutive bars a retest must hold before the line confirms a signal. */
  confirmationBars: number;
  /** Bars an AWAITING_RETEST line can wait before it's abandoned. */
  expireAfterBars: number;
  /**
   * Applies the same breakout/retest behavior to the opposite side of each
   * line (e.g. a swing-high line breaking downward triggers an immediate
   * short, same as a swing-low line does). Off by default: unconfirmed
   * against the user's own strategy notes, so left disabled rather than
   * guessed into "live" behavior.
   */
  mirroredEnabled: boolean;
}
