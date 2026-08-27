import { describe, expect, it } from "vitest";

import {
  detectOversizedLossDays,
  detectOvertradingDays,
  detectRevengeTrades,
  type PatternTrade,
} from "./patterns";

function trade(
  entryTime: string,
  exitTime: string | null,
  pnl: number | null,
  direction: "LONG" | "SHORT" = "LONG",
): PatternTrade {
  return {
    direction,
    entryTime: new Date(entryTime),
    exitTime: exitTime ? new Date(exitTime) : null,
    pnl,
    status: exitTime ? "CLOSED" : "OPEN",
  };
}

describe("detectRevengeTrades", () => {
  it("flags a new trade opened shortly after a loss", () => {
    const trades = [
      trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", -100),
      trade("2026-08-20T10:15:00Z", "2026-08-20T10:20:00Z", 50),
    ];
    const flags = detectRevengeTrades(trades, 15);
    expect(flags).toHaveLength(1);
    expect(flags[0].triggerPnl).toBe(-100);
    expect(flags[0].minutesAfter).toBe(5);
  });

  it("does not flag re-entries outside the window", () => {
    const trades = [
      trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", -100),
      trade("2026-08-20T11:00:00Z", "2026-08-20T11:20:00Z", 50),
    ];
    expect(detectRevengeTrades(trades, 15)).toHaveLength(0);
  });

  it("does not flag a re-entry after a winning trade", () => {
    const trades = [
      trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", 100),
      trade("2026-08-20T10:12:00Z", "2026-08-20T10:20:00Z", 50),
    ];
    expect(detectRevengeTrades(trades, 15)).toHaveLength(0);
  });
});

describe("detectOversizedLossDays", () => {
  it("flags a day whose net loss exceeds the threshold percentage of starting balance", () => {
    const trades = [
      trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", -2000),
      trade("2026-08-20T11:00:00Z", "2026-08-20T11:10:00Z", -600),
      trade("2026-08-21T10:00:00Z", "2026-08-21T10:10:00Z", -100),
    ];
    const flags = detectOversizedLossDays(trades, 50000, 3);
    expect(flags).toHaveLength(1);
    expect(flags[0].pnl).toBe(-2600);
  });

  it("does not flag a profitable day", () => {
    const trades = [trade("2026-08-20T10:00:00Z", "2026-08-20T10:10:00Z", 5000)];
    expect(detectOversizedLossDays(trades, 50000, 3)).toHaveLength(0);
  });
});

describe("detectOvertradingDays", () => {
  it("returns nothing with fewer than 5 days of history", () => {
    const trades = [trade("2026-08-20T10:00:00Z", null, null)];
    expect(detectOvertradingDays(trades)).toHaveLength(0);
  });

  it("flags a day with more than 2x the median trade count", () => {
    const days = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21"];
    const trades: PatternTrade[] = [];
    for (const day of days.slice(0, 4)) trades.push(trade(`${day}T10:00:00Z`, null, null));
    for (let i = 0; i < 5; i++) trades.push(trade(`${days[4]}T${10 + i}:00:00Z`, null, null));

    const flags = detectOvertradingDays(trades, 2);
    expect(flags).toHaveLength(1);
    expect(flags[0].day).toBe("2026-08-21");
    expect(flags[0].count).toBe(5);
  });
});
