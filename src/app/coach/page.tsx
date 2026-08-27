import Link from "next/link";
import { Cpu, AlertTriangle, ShieldAlert, Flame, CheckCircle2, TrendingDown, Lightbulb } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { getPayoutReadiness } from "@/lib/payout";
import { computeStreaks } from "@/lib/analytics";
import {
  computeHourlyBreakdown,
  detectOversizedLossDays,
  detectOvertradingDays,
  detectRevengeTrades,
} from "@/lib/analytics/patterns";
import { formatCurrency, formatEventTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface CoachInsight {
  icon: React.ReactNode;
  title: string;
  detail: string;
  severity: "warn" | "info";
}

export default async function CoachPage() {
  const account = await getActiveAccountWithRule();

  if (!account || !account.payoutRule) {
    return (
      <>
        <PageHeader title="AI Coach" description="Rule-based insights from your real trade data" />
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
  const closedCount = trades.filter((t) => t.status === "CLOSED").length;

  const insights: CoachInsight[] = [];

  if (closedCount > 0) {
    const revengeFlags = detectRevengeTrades(trades);
    if (revengeFlags.length > 0) {
      const latest = revengeFlags[revengeFlags.length - 1];
      insights.push({
        icon: <Flame className="size-4 text-destructive" />,
        title: `${revengeFlags.length} revenge-trade pattern${revengeFlags.length === 1 ? "" : "s"}`,
        detail: `Most recent: a new position opened ${latest.minutesAfter.toFixed(0)} minutes after a ${formatCurrency(latest.triggerPnl)} loss on ${formatEventTime(latest.triggerExitTime)}. Consider a mandatory cooldown after a loss before re-entering.`,
        severity: "warn",
      });
    }

    const oversizedDays = detectOversizedLossDays(trades, account.startingBalance);
    if (oversizedDays.length > 0) {
      const worst = oversizedDays.reduce((a, b) => (b.pnl < a.pnl ? b : a));
      insights.push({
        icon: <ShieldAlert className="size-4 text-destructive" />,
        title: `${oversizedDays.length} oversized-loss day${oversizedDays.length === 1 ? "" : "s"}`,
        detail: `Worst: ${formatCurrency(worst.pnl)} on ${worst.day} — over 3% of your starting balance in a single day. That's the kind of day that ends a Combine.`,
        severity: "warn",
      });
    }

    const overtradingDays = detectOvertradingDays(trades);
    if (overtradingDays.length > 0) {
      const worst = overtradingDays[0];
      insights.push({
        icon: <AlertTriangle className="size-4 text-chart-5" />,
        title: `Overtrading on ${worst.day}`,
        detail: `${worst.count} trades that day vs. your typical ${worst.medianCount} — more than double. Worth reviewing whether those were all real setups.`,
        severity: "warn",
      });
    }

    const streaks = computeStreaks(trades);
    if (streaks.currentType === "LOSS" && streaks.current >= 3) {
      insights.push({
        icon: <TrendingDown className="size-4 text-destructive" />,
        title: `${streaks.current}-trade losing streak`,
        detail: `Your current streak is ${streaks.current} losses in a row. Consider stepping away or cutting size until you break it — your longest losing streak on record is ${streaks.longestLoss}.`,
        severity: "warn",
      });
    }

    const hourlyStats = computeHourlyBreakdown(trades).filter((h) => h.trades >= 2);
    if (hourlyStats.length >= 3) {
      const best = hourlyStats.reduce((a, b) => (b.netPnl > a.netPnl ? b : a));
      const worst = hourlyStats.reduce((a, b) => (b.netPnl < a.netPnl ? b : a));
      if (best.hour !== worst.hour && worst.netPnl < 0) {
        insights.push({
          icon: <Lightbulb className="size-4 text-primary" />,
          title: `Your edge is concentrated around ${best.hour}:00 ET`,
          detail: `${best.hour}:00 ET nets ${formatCurrency(best.netPnl)} across ${best.trades} trades (${best.winRate.toFixed(0)}% win), while ${worst.hour}:00 ET nets ${formatCurrency(worst.netPnl)}. Worth considering whether you should be trading that hour at all.`,
          severity: "info",
        });
      }
    }
  }

  const readiness = getPayoutReadiness(account, account.payoutRule, trades);
  if (account.trailingDrawdown > 0 && readiness.drawdown.remaining < account.trailingDrawdown * 0.2) {
    insights.push({
      icon: <ShieldAlert className="size-4 text-destructive" />,
      title: "Drawdown cushion is thin",
      detail: `Only ${formatMoney(readiness.drawdown.remaining)} of cushion left before the trailing-drawdown floor. Consider sizing down until the cushion rebuilds.`,
      severity: "warn",
    });
  }

  if (readiness.consistency.status === "FAIL" || readiness.consistency.status === "AT_RISK") {
    insights.push({
      icon: <AlertTriangle className="size-4 text-chart-5" />,
      title: `Consistency rule ${readiness.consistency.status === "FAIL" ? "failing" : "at risk"}`,
      detail: `Your best day is ${(readiness.consistency.ratio * 100).toFixed(0)}% of total profit${readiness.consistency.offendingDay ? ` (${readiness.consistency.offendingDay})` : ""}. Spread out gains across more days before requesting payout.`,
      severity: "warn",
    });
  }

  return (
    <>
      <PageHeader title="AI Coach" description="Rule-based insights from your real trade data — no LLM, no fabricated advice" />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          {closedCount === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No closed trades yet — log some in the{" "}
                <Link href="/journal" className="text-primary underline">
                  Journal
                </Link>{" "}
                to get coaching insights.
              </CardContent>
            </Card>
          ) : insights.length === 0 ? (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-center gap-3 pt-6 text-sm">
                <CheckCircle2 className="size-5 text-success" />
                <p>No risk-behavior or payout-rule issues detected right now. Keep it up.</p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight, i) => (
              <Card key={i} className={insight.severity === "info" ? "border-primary/30 bg-primary/5" : undefined}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {insight.icon}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insight.detail}</p>
                </CardContent>
              </Card>
            ))
          )}

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="size-3.5" /> How this works
              </CardTitle>
              <CardDescription>
                These are deterministic rules run against your logged trades and account settings — not a
                language model. See{" "}
                <Link href="/pattern-intel" className="text-primary underline">
                  Pattern Intel
                </Link>{" "}
                for the full breakdown behind each flag.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
