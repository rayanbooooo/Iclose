import { formatInTimeZone } from "date-fns-tz";

const CME_TIMEZONE = "America/New_York";

/**
 * Buckets a trade into a "trading day" by the exchange-local (ET) calendar
 * date of its close (or open, if still open). This is a practical
 * simplification, not CME's official trade-date convention (which rolls
 * the overnight Globex session into the next session's date) — good enough
 * for daily P&L/consistency-rule grouping of a 15m intraday strategy.
 */
export function getTradingDay(date: Date): string {
  return formatInTimeZone(date, CME_TIMEZONE, "yyyy-MM-dd");
}

export function groupByTradingDay<T extends { entryTime: Date; exitTime: Date | null }>(
  trades: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const trade of trades) {
    const day = getTradingDay(trade.exitTime ?? trade.entryTime);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(trade);
  }
  return groups;
}
