import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { computeEquityCurve, computePnlByDay, computeStreaks, computeWinRate } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { EquityChart } from "./equity-chart";
import { PnlByDayChart } from "./pnl-by-day-chart";

export default async function StatsPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
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
      </>
    );
  }

  const trades = await db.trade.findMany({ where: { accountId: account.id } });

  const winRate = computeWinRate(trades);
  const streaks = computeStreaks(trades);
  const equityCurve = computeEquityCurve(trades, account.startingBalance);
  const pnlByDay = computePnlByDay(trades);
  const netPnl = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].balance - account.startingBalance : 0;

  if (winRate.total === 0) {
    return (
      <>
        <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
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
      </>
    );
  }

  return (
    <>
      <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
      <div className="space-y-4 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net P&L</CardDescription>
              <CardTitle className={netPnl >= 0 ? "text-success" : "text-destructive"}>
                {formatCurrency(netPnl)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Win rate</CardDescription>
              <CardTitle>
                {winRate.pct.toFixed(1)}%{" "}
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
                {streaks.current} {streaks.currentType === "WIN" ? "wins" : streaks.currentType === "LOSS" ? "losses" : ""}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best / worst streak</CardDescription>
              <CardTitle className="text-base">
                <span className="text-success">{streaks.longestWin}W</span>
                {" · "}
                <span className="text-destructive">{streaks.longestLoss}L</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

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
    </>
  );
}
