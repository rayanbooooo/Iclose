import Link from "next/link";
import { CandlestickChart, ShieldCheck, NotebookText, BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { getPayoutReadiness } from "@/lib/payout";
import { computeWinRate, computeEquityCurve } from "@/lib/analytics";
import { formatCurrency, formatMoney } from "@/lib/format";

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
      </>
    );
  }

  const trades = await db.trade.findMany({
    where: { accountId: account.id },
    orderBy: { entryTime: "desc" },
  });

  const readiness = getPayoutReadiness(account, account.payoutRule, trades);
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
      <div className="grid gap-4 p-6 md:p-8 lg:grid-cols-2">
        <EmptyState
          icon={CandlestickChart}
          title="Chart"
          description="Live MNQ 15m candles with swing-hi/lo lines and signal markers."
          phase="Next up: strategy engine + live chart."
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Payout readiness
                </CardTitle>
                <CardDescription>{account.name}</CardDescription>
              </div>
              <Badge variant={CONSISTENCY_BADGE[readiness.consistency.status]}>
                {readiness.consistency.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatMoney(readiness.balance)}
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Profit target</span>
                <span className="tabular-nums">
                  {formatCurrency(readiness.profitTarget.profit)} / {formatMoney(readiness.profitTarget.target)}
                </span>
              </div>
              <Progress value={readiness.profitTarget.pct} />
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Drawdown cushion remaining</span>
                <span className="tabular-nums">{formatMoney(readiness.drawdown.remaining)}</span>
              </div>
              <Progress
                value={100 - drawdownUsedPct}
                indicatorClassName={drawdownUsedPct > 70 ? "bg-destructive" : undefined}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                Trading days: {readiness.tradingDays.count}/{readiness.tradingDays.required}
              </span>
              <span>·</span>
              <span>
                Winning days: {readiness.winningDays.count}/{readiness.winningDays.required}
              </span>
            </div>
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
          <CardContent>
            {winRate.total === 0 ? (
              <p className="text-sm text-muted-foreground">No closed trades yet.</p>
            ) : (
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Net P&L</p>
                  <p className={"text-lg font-semibold " + (netPnl >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(netPnl)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Win rate</p>
                  <p className="text-lg font-semibold">{winRate.pct.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trades</p>
                  <p className="text-lg font-semibold">{winRate.total}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
