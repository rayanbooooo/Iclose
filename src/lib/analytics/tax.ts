import { getTradingDay } from "@/lib/trading-day";

export interface TaxTrade {
  entryTime: Date;
  exitTime: Date | null;
  pnl: number | null;
  fees: number;
  status: string;
}

export interface QuarterSummary {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  trades: number;
  netPnl: number;
  fees: number;
}

/** Realized P&L grouped by calendar year/quarter (ET trading-day date), for tax reporting purposes. */
export function groupPnlByQuarter(trades: TaxTrade[]): QuarterSummary[] {
  const closed = trades.filter(
    (t): t is TaxTrade & { pnl: number; exitTime: Date } => t.status === "CLOSED" && t.pnl !== null && t.exitTime !== null,
  );

  const buckets = new Map<string, QuarterSummary>();
  for (const t of closed) {
    const day = getTradingDay(t.exitTime);
    const [yearStr, monthStr] = day.split("-");
    const year = Number(yearStr);
    const quarter = (Math.floor((Number(monthStr) - 1) / 3) + 1) as 1 | 2 | 3 | 4;
    const key = `${year}-Q${quarter}`;
    const bucket = buckets.get(key) ?? { year, quarter, trades: 0, netPnl: 0, fees: 0 };
    bucket.trades += 1;
    bucket.netPnl += t.pnl;
    bucket.fees += t.fees;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.year - b.year || a.quarter - b.quarter);
}
