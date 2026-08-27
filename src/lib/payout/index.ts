import { groupByTradingDay } from "@/lib/trading-day";

export interface PayoutTrade {
  entryTime: Date;
  exitTime: Date | null;
  pnl: number | null;
  status: string;
}

export interface PayoutAccount {
  startingBalance: number;
  profitTarget: number;
  trailingDrawdown: number;
  drawdownMode: string;
}

export interface PayoutRuleInput {
  consistencyRulePct: number;
  minWinningDays: number;
  minWinningDayAmount: number;
  minTradingDays: number;
}

export type RuleStatus = "PASS" | "AT_RISK" | "FAIL" | "INSUFFICIENT_DATA";

function closedTrades(trades: PayoutTrade[]) {
  return trades.filter((t): t is PayoutTrade & { pnl: number; exitTime: Date } =>
    t.status === "CLOSED" && t.pnl !== null && t.exitTime !== null,
  );
}

function dailyPnl(trades: PayoutTrade[]): Map<string, number> {
  const closed = closedTrades(trades);
  const groups = groupByTradingDay(closed);
  const result = new Map<string, number>();
  for (const [day, dayTrades] of groups) {
    result.set(
      day,
      dayTrades.reduce((sum, t) => sum + t.pnl, 0),
    );
  }
  return result;
}

export function computeCurrentBalance(account: PayoutAccount, trades: PayoutTrade[]): number {
  const closed = closedTrades(trades);
  const totalPnl = closed.reduce((sum, t) => sum + t.pnl, 0);
  return account.startingBalance + totalPnl;
}

/**
 * End-of-day balances, sorted chronologically by trading day, as a running
 * cumulative total starting from the account's starting balance.
 */
function eodBalanceSeries(account: PayoutAccount, trades: PayoutTrade[]): { day: string; balance: number }[] {
  const daily = dailyPnl(trades);
  const days = [...daily.keys()].sort();
  let running = account.startingBalance;
  const series: { day: string; balance: number }[] = [];
  for (const day of days) {
    running += daily.get(day)!;
    series.push({ day, balance: running });
  }
  return series;
}

export function computeTrailingDrawdown(account: PayoutAccount, trades: PayoutTrade[]) {
  const series = eodBalanceSeries(account, trades);
  const highWaterMark = Math.max(account.startingBalance, ...series.map((s) => s.balance));

  let floor: number;
  if (account.drawdownMode === "EOD_TRAILING_LOCK_AT_START") {
    floor = Math.min(highWaterMark - account.trailingDrawdown, account.startingBalance);
  } else {
    // INTRADAY_TRAILING (or unrecognized mode): trails the high-water mark
    // without locking — conservative default (never assume a mode we don't
    // recognize is safer than the account's actual rules).
    floor = highWaterMark - account.trailingDrawdown;
  }

  const currentBalance = computeCurrentBalance(account, trades);
  const remaining = currentBalance - floor;

  return { highWaterMark, floor, currentBalance, remaining, breached: remaining < 0 };
}

export function computeProfitTargetProgress(account: PayoutAccount, trades: PayoutTrade[]) {
  const currentBalance = computeCurrentBalance(account, trades);
  const profit = currentBalance - account.startingBalance;
  const pct = account.profitTarget > 0 ? Math.max(0, Math.min(100, (profit / account.profitTarget) * 100)) : 0;
  return { profit, target: account.profitTarget, pct, met: profit >= account.profitTarget };
}

export function computeConsistencyRule(trades: PayoutTrade[], rule: PayoutRuleInput) {
  const daily = dailyPnl(trades);
  const totalProfit = [...daily.values()].reduce((sum, v) => sum + v, 0);
  const maxDayProfit = Math.max(0, ...daily.values());

  if (totalProfit <= 0) {
    return { status: "INSUFFICIENT_DATA" as RuleStatus, ratio: 0, maxDayProfit, totalProfit, offendingDay: null as string | null };
  }

  const ratio = maxDayProfit / totalProfit;
  const threshold = rule.consistencyRulePct / 100;
  const status: RuleStatus = ratio > threshold ? "FAIL" : ratio > threshold * 0.8 ? "AT_RISK" : "PASS";

  let offendingDay: string | null = null;
  if (status !== "PASS") {
    for (const [day, pnl] of daily) {
      if (pnl === maxDayProfit) {
        offendingDay = day;
        break;
      }
    }
  }

  return { status, ratio, maxDayProfit, totalProfit, offendingDay };
}

export function computeTradingDaysProgress(trades: PayoutTrade[], rule: PayoutRuleInput) {
  const daily = dailyPnl(trades);
  const count = daily.size;
  return { count, required: rule.minTradingDays, met: count >= rule.minTradingDays };
}

export function computeWinningDaysProgress(trades: PayoutTrade[], rule: PayoutRuleInput) {
  const daily = dailyPnl(trades);
  const count = [...daily.values()].filter((v) => v >= rule.minWinningDayAmount).length;
  return { count, required: rule.minWinningDays, met: count >= rule.minWinningDays };
}

export function getPayoutReadiness(
  account: PayoutAccount,
  rule: PayoutRuleInput,
  trades: PayoutTrade[],
) {
  return {
    balance: computeCurrentBalance(account, trades),
    drawdown: computeTrailingDrawdown(account, trades),
    profitTarget: computeProfitTargetProgress(account, trades),
    consistency: computeConsistencyRule(trades, rule),
    tradingDays: computeTradingDaysProgress(trades, rule),
    winningDays: computeWinningDaysProgress(trades, rule),
  };
}
