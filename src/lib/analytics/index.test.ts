import { describe, expect, it } from "vitest";

import { computeTradeStats, type TradeStatsTrade } from "./index";

function trade(entryTime: string, exitTime: string, pnl: number): TradeStatsTrade {
  return { entryTime: new Date(entryTime), exitTime: new Date(exitTime), pnl, status: "CLOSED" };
}

describe("computeTradeStats", () => {
  it("computes avg win/loss, profit factor, best/worst trade, and avg hold time", () => {
    const trades = [
      trade("2026-08-20T10:00:00Z", "2026-08-20T10:30:00Z", 200),
      trade("2026-08-20T11:00:00Z", "2026-08-20T11:15:00Z", -100),
      trade("2026-08-21T10:00:00Z", "2026-08-21T11:00:00Z", 400),
      trade("2026-08-21T12:00:00Z", "2026-08-21T12:20:00Z", -50),
    ];

    const stats = computeTradeStats(trades);

    expect(stats.avgWin).toBe(300); // (200+400)/2
    expect(stats.avgLoss).toBe(-75); // (-100-50)/2
    expect(stats.profitFactor).toBeCloseTo(4, 5); // 600 / 150
    expect(stats.bestTrade?.pnl).toBe(400);
    expect(stats.worstTrade?.pnl).toBe(-100);
    // hold times: 30, 15, 60, 20 minutes -> avg 31.25
    expect(stats.avgHoldMinutes).toBeCloseTo(31.25, 5);
  });

  it("handles no losses as an infinite profit factor and no wins as zero", () => {
    const allWins = [trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", 100)];
    expect(computeTradeStats(allWins).profitFactor).toBe(Infinity);

    const allLosses = [trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", -100)];
    expect(computeTradeStats(allLosses).profitFactor).toBe(0);
  });

  it("returns nulls/zeros with no closed trades", () => {
    const stats = computeTradeStats([]);
    expect(stats.bestTrade).toBeNull();
    expect(stats.worstTrade).toBeNull();
    expect(stats.avgWin).toBe(0);
    expect(stats.avgLoss).toBe(0);
    expect(stats.avgHoldMinutes).toBe(0);
  });
});
