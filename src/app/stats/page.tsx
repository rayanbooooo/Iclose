import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { computeEquityCurve, computePnlByDay, computeStreaks, computeTradeStats, computeWinRate } from "@/lib/analytics";
import { computeDirectionBreakdown } from "@/lib/analytics/patterns";
import { PageTransition } from "@/components/page-transition";
import { AnimatedNumber } from "@/components/animated-number";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatMoney } from "@/lib/format";
import { EquityChart } from "./equity-chart";
import { PnlByDayChart } from "./pnl-by-day-chart";
import { TradingCalendar } from "./trading-calendar";

// Reads live trade data — must render per-request, not be baked in as a
// static page at build time.
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
        <PageTransition>
          <div className="p-6 md:p-8">
            <Card className="max-w-md border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Set up your account in{" "}
                <Link href="/settings" className="text-primary underline">
                  Settings
                </Link>{" "}
                first.
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </>
    );
  }

  const trades = await db.trade.findMany({ where: { accountId: account.id } });

  const winRate = computeWinRate(trades);
  const streaks = computeStreaks(trades);
  const equityCurve = computeEquityCurve(trades, account.startingBalance);
  const pnlByDay = computePnlByDay(trades);
  const tradeStats = computeTradeStats(trades);
  const directionStats = computeDirectionBreakdown(trades);
  const netPnl = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].balance - account.startingBalance : 0;

  if (winRate.total === 0) {
    return (
      <>
        <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
        <PageTransition>
          <div className="p-6 md:p-8">
            <Card className="border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No closed trades yet. Analytics show up here once you&rsquo;ve logged and closed
                some trades in the{" "}
                <Link href="/journal" className="text-primary underline">
                  Journal
                </Link>
                .
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
      <PageTransition>
      <div className="space-y-4 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net P&L</CardDescription>
              <CardTitle className={netPnl >= 0 ? "text-success" : "text-destructive"}>
                <AnimatedNumber value={netPnl} prefix="$" decimals={2} signed />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Win rate</CardDescription>
              <CardTitle>
                <AnimatedNumber value={winRate.pct} decimals={1} suffix="%" />{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({winRate.wins}W / {winRate.losses}L)
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current streak</CardDescription>
              <CardTitle className={streaks.currentType === "WIN" ? "text-success" : "text-destructive"}>
                <AnimatedNumber value={streaks.current} />{" "}
                {streaks.currentType === "WIN" ? "wins" : streaks.currentType === "LOSS" ? "losses" : ""}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best / worst streak</CardDescription>
              <CardTitle className="text-base">
                <span className="text-success">
                  <AnimatedNumber value={streaks.longestWin} />W
                </span>
                {" · "}
                <span className="text-destructive">
                  <AnimatedNumber value={streaks.longestLoss} />L
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Profit factor</CardDescription>
              <CardTitle>
                {tradeStats.profitFactor === Infinity ? "∞" : tradeStats.profitFactor.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg win / avg loss</CardDescription>
              <CardTitle className="text-base">
                <span className="text-success">{formatMoney(tradeStats.avgWin)}</span>
                {" / "}
                <span className="text-destructive">{formatMoney(Math.abs(tradeStats.avgLoss))}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best / worst trade</CardDescription>
              <CardTitle className="text-base">
                <span className="text-success">
                  {tradeStats.bestTrade ? formatCurrency(tradeStats.bestTrade.pnl) : "—"}
                </span>
                {" / "}
                <span className="text-destructive">
                  {tradeStats.worstTrade ? formatCurrency(tradeStats.worstTrade.pnl) : "—"}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg hold time</CardDescription>
              <CardTitle>
                {tradeStats.avgHoldMinutes >= 60
                  ? `${(tradeStats.avgHoldMinutes / 60).toFixed(1)}h`
                  : `${tradeStats.avgHoldMinutes.toFixed(0)}m`}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {directionStats.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>By direction</CardTitle>
              <CardDescription>Long vs. short performance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6">
              {directionStats.map((d) => (
                <div key={d.direction} className="flex items-center gap-3">
                  <Badge variant={d.direction === "LONG" ? "success" : "destructive"}>{d.direction}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {d.trades} trades · {d.winRate.toFixed(0)}% win ·{" "}
                    <span className={d.netPnl >= 0 ? "text-success" : "text-destructive"}>
                      {formatCurrency(d.netPnl)}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Daily P&amp;L by month, weekly rollups in the Saturday column</CardDescription>
          </CardHeader>
          <CardContent>
            <TradingCalendar dailyPnl={pnlByDay} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Equity curve</CardTitle>
              <CardDescription>Account balance after each closed trade</CardDescription>
            </CardHeader>
            <CardContent>
              <EquityChart data={equityCurve} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>P&L by day</CardTitle>
              <CardDescription>Net P&L per trading day (ET)</CardDescription>
            </CardHeader>
            <CardContent>
              <PnlByDayChart data={pnlByDay} />
            </CardContent>
          </Card>
        </div>
      </div>
      </PageTransition>
    </>
  );
}
