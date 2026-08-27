export type TradeDirection = "LONG" | "SHORT";

export function computeTradePnl(trade: {
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  contracts: number;
  contractMultiplier: number;
  fees: number;
}): number {
  const directionMultiplier = trade.direction === "LONG" ? 1 : -1;
  const gross =
    (trade.exitPrice - trade.entryPrice) *
    directionMultiplier *
    trade.contractMultiplier *
    trade.contracts;
  return gross - trade.fees;
}
