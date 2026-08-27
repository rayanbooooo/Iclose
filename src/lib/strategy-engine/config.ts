import type { StrategyConfig } from "./types";

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  lookbackPeriod: 5,
  retestTolerancePct: 0.1,
  confirmationBars: 1,
  expireAfterBars: 20,
  mirroredEnabled: false,
};
