import { groupByTradingDay } from "@/lib/trading-day";

export interface PatternTrade {
  direction: string;
  entryTime: Date;
  exitTime: Date | null;
  pnl: number | null;
  status: string;
}

function closedSortedByExit<T extends PatternTrade>(trades: T[]) {
  return trades
    .filter((t): t is T & { pnl: number; exitTime: Date } => t.status === "CLOSED" && t.pnl !== null && t.exitTime !== null)
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface WeekdayStat {
  day: (typeof WEEKDAYS)[number];
  trades: number;
  wins: number;
  winRate: number;
  netPnl: number;
}

export function computeWeekdayBreakdown(trades: PatternTrade[]): WeekdayStat[] {
  const closed = closedSortedByExit(trades);
  const buckets = new Map<number, { wins: number; count: number; netPnl: number }>();
  for (const t of closed) {
    const dow = t.exitTime.getDay();
    const bucket = buckets.get(dow) ?? { wins: 0, count: 0, netPnl: 0 };
    bucket.count += 1;
    bucket.netPnl += t.pnl;
    if (t.pnl > 0) bucket.wins += 1;
    buckets.set(dow, bucket);
  }
  return WEEKDAYS.map((day, i) => {
    const b = buckets.get(i) ?? { wins: 0, count: 0, netPnl: 0 };
    return { day, trades: b.count, wins: b.wins, winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0, netPnl: b.netPnl };
  });
}

export interface DirectionStat {
  direction: string;
  trades: number;
  wins: number;
  winRate: number;
  netPnl: number;
}

export function computeDirectionBreakdown(trades: PatternTrade[]): DirectionStat[] {
  const closed = closedSortedByExit(trades);
  const buckets = new Map<string, { wins: number; count: number; netPnl: number }>();
  for (const t of closed) {
    const bucket = buckets.get(t.direction) ?? { wins: 0, count: 0, netPnl: 0 };
    bucket.count += 1;
    bucket.netPnl += t.pnl;
    if (t.pnl > 0) bucket.wins += 1;
    buckets.set(t.direction, bucket);
  }
  return [...buckets.entries()].map(([direction, b]) => ({
    direction,
    trades: b.count,
    wins: b.wins,
    winRate: (b.wins / b.count) * 100,
    netPnl: b.netPnl,
  }));
}

export interface RevengeTradeFlag {
  triggerExitTime: string;
  triggerPnl: number;
  revengeEntryTime: string;
  minutesAfter: number;
}

/**
 * Flags a new trade opened shortly after a losing trade's exit — a common
 * marker of "revenge trading" (re-entering to immediately win back a loss
 * rather than waiting for a real setup).
 */
export function detectRevengeTrades(trades: PatternTrade[], windowMinutes = 15): RevengeTradeFlag[] {
  const closed = closedSortedByExit(trades);
  const flags: RevengeTradeFlag[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    if (closed[i].pnl >= 0) continue;
    const next = closed[i + 1];
    const minutesAfter = (next.entryTime.getTime() - closed[i].exitTime.getTime()) / 60000;
    if (minutesAfter >= 0 && minutesAfter <= windowMinutes) {
      flags.push({
        triggerExitTime: closed[i].exitTime.toISOString(),
        triggerPnl: closed[i].pnl,
        revengeEntryTime: next.entryTime.toISOString(),
        minutesAfter,
      });
    }
  }
  return flags;
}

export interface OversizedDayFlag {
  day: string;
  pnl: number;
}

/** Flags trading days whose net loss exceeds a % of the account's starting balance. */
export function detectOversizedLossDays(
  trades: PatternTrade[],
  startingBalance: number,
  thresholdPct = 3,
): OversizedDayFlag[] {
  const closed = closedSortedByExit(trades);
  const groups = groupByTradingDay(closed);
  const flags: OversizedDayFlag[] = [];
  for (const [day, dayTrades] of groups) {
    const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    if (pnl < 0 && startingBalance > 0 && Math.abs(pnl) > startingBalance * (thresholdPct / 100)) {
      flags.push({ day, pnl });
    }
  }
  return flags.sort((a, b) => a.day.localeCompare(b.day));
}

export interface OvertradingFlag {
  day: string;
  count: number;
  medianCount: number;
}

/** Flags days with unusually high trade count relative to the trader's own median day (needs at least 5 days of history). */
export function detectOvertradingDays(trades: PatternTrade[], multiplier = 2): OvertradingFlag[] {
  const groups = groupByTradingDay(trades);
  const counts = [...groups.entries()].map(([day, dayTrades]) => ({ day, count: dayTrades.length }));
  if (counts.length < 5) return [];

  const sorted = [...counts.map((c) => c.count)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median === 0) return [];

  return counts
    .filter((c) => c.count > median * multiplier)
    .map((c) => ({ ...c, medianCount: median }))
    .sort((a, b) => b.count - a.count);
}
