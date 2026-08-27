import Link from "next/link";
import {
  CandlestickChart,
  NotebookText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  CalendarClock,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { AnimatedNumber } from "@/components/animated-number";
import { EquitySparkline } from "@/components/equity-sparkline";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { getPayoutReadiness } from "@/lib/payout";
import { computeWinRate, computeEquityCurve } from "@/lib/analytics";
import { formatCurrency, formatEventTime, formatMoney } from "@/lib/format";
import { generateSampleCandles } from "@/lib/data-providers/sample-provider";
import { DEFAULT_STRATEGY_CONFIG, runStrategy } from "@/lib/strategy-engine/engine";
import { getEconomicCalendar } from "@/lib/market-data/read";

// Reads live account/trade data — must render per-request, not be baked in
// as a static page at build time.
export const dynamic = "force-dynamic";

const CONSISTENCY_BADGE: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  PASS: "success",
  AT_RISK: "secondary",
  FAIL: "destructive",
  INSUFFICIENT_DATA: "outline",
};

export default async function DashboardPage() {
  const account = await getActiveAccountWithRule();

  if (!account || !account.payoutRule) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="MNQ 15m swing-high/low strategy · Topstep payout tracker"
        />
        <PageTransition>
          <div className="p-6 md:p-8">
            <Card className="max-w-md border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Set up your account in{" "}
                <Link href="/settings" className="text-primary underline">
                  Settings
                </Link>{" "}
                to see your payout readiness, trades, and performance here.
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </>
    );
  }

  const trades = await db.trade.findMany({
    where: { accountId: account.id },
    orderBy: { entryTime: "desc" },
  });

  const [activeSession, calendar] = await Promise.all([
    db.tradingSession.findFirst({ where: { accountId: account.id, endedAt: null } }),
    getEconomicCalendar(),
  ]);

  const todayEt = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const highImpactToday = calendar.events.filter(
    (e) =>
      e.impact === "High" &&
      new Date(e.time).toLocaleDateString("en-US", { timeZone: "America/New_York" }) === todayEt,
  );

  const readiness = getPayoutReadiness(account, account.payoutRule, trades);
  const sampleCandles = generateSampleCandles();
  const { signals } = runStrategy(sampleCandles, DEFAULT_STRATEGY_CONFIG);
  const latestSignal = signals[signals.length - 1];
  const winRate = computeWinRate(trades);
  const equityCurve = computeEquityCurve(trades, account.startingBalance);
  const netPnl = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].balance - account.startingBalance : 0;
  const recentTrades = trades.slice(0, 5);

  const drawdownUsedPct =
    account.trailingDrawdown > 0
      ? Math.max(0, Math.min(100, 100 - (readiness.drawdown.remaining / account.trailingDrawdown) * 100))
      : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="MNQ 15m swing-high/low strategy · Topstep payout tracker"
      />
      <PageTransition>
      <div className="space-y-4 p-6 md:p-8">
        {activeSession && (
          <Link href="/session">
            <Card className="border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10">
              <CardContent className="flex items-center gap-3 py-3">
                <span className="relative inline-flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <PlayCircle className="size-4 text-primary" />
                <span className="text-sm">
                  Session in progress since{" "}
                  {activeSession.startedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="ml-auto text-xs text-primary">View →</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {highImpactToday.length > 0 && (
          <Card className="border-dashed border-chart-5/40 bg-chart-5/5">
            <CardContent className="flex flex-wrap items-center gap-2 py-3 text-xs">
              <CalendarClock className="size-3.5 shrink-0 text-chart-5" />
              <span className="text-muted-foreground">High-impact today:</span>
              {highImpactToday.map((e, i) => (
                <Badge key={`${e.event}-${i}`} variant="outline" className="border-chart-5/40 text-chart-5">
                  {e.event}
                </Badge>
              ))}
              <Link href="/global-intelligence" className="ml-auto text-primary hover:underline">
                Full calendar →
              </Link>
            </CardContent>
          </Card>
        )}

      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 p-6 backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,theme(colors.primary/15%),transparent_60%)]" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Account balance
              </p>
              <Badge variant={CONSISTENCY_BADGE[readiness.consistency.status]}>
                {readiness.consistency.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-5xl font-bold tabular-nums text-transparent md:text-6xl">
              <AnimatedNumber value={readiness.balance} prefix="$" decimals={2} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {account.name} · {account.accountType.replace("_", " ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                Trading days: {readiness.tradingDays.count}/{readiness.tradingDays.required}
              </span>
              <span>
                Winning days: {readiness.winningDays.count}/{readiness.winningDays.required}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <RadialGauge
              value={readiness.profitTarget.pct}
              color="var(--color-primary)"
              label={`${readiness.profitTarget.pct.toFixed(0)}%`}
              sublabel="Profit target"
            />
            <RadialGauge
              value={100 - drawdownUsedPct}
              color={drawdownUsedPct > 70 ? "var(--color-destructive)" : "var(--color-success)"}
              label={formatMoney(readiness.drawdown.remaining)}
              sublabel="Drawdown cushion"
            />
            <RadialGauge
              value={
                readiness.tradingDays.required > 0
                  ? Math.min(100, (readiness.tradingDays.count / readiness.tradingDays.required) * 100)
                  : 100
              }
              color="var(--color-accent)"
              label={`${readiness.tradingDays.count}/${readiness.tradingDays.required}`}
              sublabel="Trading days"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CandlestickChart className="size-4" /> Strategy signal
              </CardTitle>
              <Link href="/chart" className="text-xs text-primary hover:underline">
                Full chart
              </Link>
            </div>
            <CardDescription>MNQ · 15m · latest breakout/retest signal (sample data)</CardDescription>
          </CardHeader>
          <CardContent>
            {!latestSignal ? (
              <p className="text-sm text-muted-foreground">No signals fired against this sample run.</p>
            ) : (
              <div className="flex items-center gap-3">
                <Badge variant={latestSignal.direction === "LONG" ? "success" : "destructive"} className="gap-1">
                  {latestSignal.direction === "LONG" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {latestSignal.direction}
                </Badge>
                <span className="text-sm font-medium tabular-nums">{formatMoney(latestSignal.price)}</span>
                <span className="text-xs text-muted-foreground">
                  {latestSignal.kind === "BREAKOUT" ? "Breakout" : "Retest"} ·{" "}
                  {formatEventTime(new Date(latestSignal.time * 1000).toISOString())}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookText className="size-4" /> Recent trades
            </CardTitle>
            <CardDescription>
              <Link href="/journal" className="text-primary hover:underline">
                View all in Journal
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentTrades.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={t.direction === "LONG" ? "success" : "destructive"}>
                        {t.direction}
                      </Badge>
                      <span className="text-muted-foreground">
                        {t.entryTime.toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={
                        t.pnl === null
                          ? "text-muted-foreground"
                          : t.pnl >= 0
                            ? "text-success"
                            : "text-destructive"
                      }
                    >
                      {t.pnl === null ? "open" : formatCurrency(t.pnl)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" /> Performance
            </CardTitle>
            <CardDescription>
              <Link href="/stats" className="text-primary hover:underline">
                Full stats
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {winRate.total === 0 ? (
              <p className="text-sm text-muted-foreground">No closed trades yet.</p>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Net P&L</p>
                    <p className={"text-lg font-semibold " + (netPnl >= 0 ? "text-success" : "text-destructive")}>
                      <AnimatedNumber value={netPnl} prefix="$" decimals={2} signed />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win rate</p>
                    <p className="text-lg font-semibold">
                      <AnimatedNumber value={winRate.pct} decimals={0} suffix="%" />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-lg font-semibold">
                      <AnimatedNumber value={winRate.total} />
                    </p>
                  </div>
                </div>
                {equityCurve.length > 1 && <EquitySparkline data={equityCurve} />}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
      </PageTransition>
    </>
  );
}
