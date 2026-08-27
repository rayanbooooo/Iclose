import { groupByTradingDay } from "@/lib/trading-day";

export interface AnalyticsTrade {
  entryTime: Date;
  exitTime: Date | null;
  pnl: number | null;
  status: string;
}

function closedSortedByExit<T extends AnalyticsTrade>(trades: T[]) {
  return trades
    .filter((t): t is T & { pnl: number; exitTime: Date } => t.status === "CLOSED" && t.pnl !== null && t.exitTime !== null)
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
}

export function computeWinRate(trades: AnalyticsTrade[]) {
  const closed = closedSortedByExit(trades);
  const wins = closed.filter((t) => t.pnl > 0).length;
  const losses = closed.filter((t) => t.pnl <= 0).length;
  const total = closed.length;
  return { wins, losses, total, pct: total > 0 ? (wins / total) * 100 : 0 };
}

export function computeEquityCurve(trades: AnalyticsTrade[], startingBalance = 0) {
  const closed = closedSortedByExit(trades);
  let running = startingBalance;
  return closed.map((t) => {
    running += t.pnl;
    return { date: t.exitTime.toISOString(), balance: running, pnl: t.pnl };
  });
}

export function computePnlByDay(trades: AnalyticsTrade[]) {
  const closed = closedSortedByExit(trades);
  const groups = groupByTradingDay(closed);
  return [...groups.entries()]
    .map(([day, dayTrades]) => ({
      day,
      pnl: dayTrades.reduce((sum, t) => sum + t.pnl, 0),
      trades: dayTrades.length,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function computeStreaks(trades: AnalyticsTrade[]) {
  const closed = closedSortedByExit(trades);

  let current = 0;
  let currentType: "WIN" | "LOSS" | null = null;
  let longestWin = 0;
  let longestLoss = 0;
  let runWin = 0;
  let runLoss = 0;

  for (const t of closed) {
    const isWin = t.pnl > 0;
    if (isWin) {
      runWin += 1;
      runLoss = 0;
      longestWin = Math.max(longestWin, runWin);
    } else {
      runLoss += 1;
      runWin = 0;
      longestLoss = Math.max(longestLoss, runLoss);
    }
  }

  if (closed.length > 0) {
    const last = closed[closed.length - 1];
    currentType = last.pnl > 0 ? "WIN" : "LOSS";
    current = currentType === "WIN" ? runWin : runLoss;
  }

  return { current, currentType, longestWin, longestLoss };
}
