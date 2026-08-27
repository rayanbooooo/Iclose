import { DEFAULT_STRATEGY_CONFIG } from "./config";
import { generateSignals } from "./signals";
import { detectSwingPoints } from "./swings";
import type { Candle, StrategyConfig, StrategySignal, SwingPoint } from "./types";

export interface StrategyResult {
  swingPoints: SwingPoint[];
  signals: StrategySignal[];
}

export function runStrategy(candles: Candle[], config: StrategyConfig = DEFAULT_STRATEGY_CONFIG): StrategyResult {
  const swingPoints = detectSwingPoints(candles, config.lookbackPeriod);
  const signals = generateSignals(candles, swingPoints, config);
  return { swingPoints, signals };
}

export * from "./types";
export { DEFAULT_STRATEGY_CONFIG } from "./config";
export { detectSwingPoints } from "./swings";
export { generateSignals } from "./signals";
