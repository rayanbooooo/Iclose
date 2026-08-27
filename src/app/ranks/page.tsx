import Link from "next/link";
import { Award, Check, Circle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { getPayoutReadiness } from "@/lib/payout";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIER_NAMES = ["Getting started", "Building volume", "Profit target", "Consistency", "Payout eligible"];

export default async function RanksPage() {
  const account = await getActiveAccountWithRule();

  if (!account || !account.payoutRule) {
    return (
      <>
        <PageHeader title="Ranks" description="Your real progress toward a Topstep payout" />
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
  const readiness = getPayoutReadiness(account, account.payoutRule, trades);

  const milestones = [
    {
      label: "Trading days requirement",
      met: readiness.tradingDays.met,
      detail: `${readiness.tradingDays.count}/${readiness.tradingDays.required} days`,
      pct: readiness.tradingDays.required > 0 ? (readiness.tradingDays.count / readiness.tradingDays.required) * 100 : 100,
      href: "/journal",
    },
    {
      label: "Winning days requirement",
      met: readiness.winningDays.met,
      detail: `${readiness.winningDays.count}/${readiness.winningDays.required} days`,
      pct: readiness.winningDays.required > 0 ? (readiness.winningDays.count / readiness.winningDays.required) * 100 : 100,
      href: "/stats",
    },
    {
      label: "Profit target",
      met: readiness.profitTarget.met,
      detail: `${readiness.profitTarget.pct.toFixed(0)}% of target`,
      pct: readiness.profitTarget.pct,
      href: "/stats",
    },
    {
      label: "Consistency rule",
      met: readiness.consistency.status === "PASS",
      detail: readiness.consistency.status.replace("_", " "),
      pct: readiness.consistency.status === "PASS" ? 100 : readiness.consistency.status === "AT_RISK" ? 60 : 20,
      href: "/pattern-intel",
    },
    {
      label: "Drawdown not breached",
      met: !readiness.drawdown.breached,
      detail: readiness.drawdown.breached ? "breached" : "clear",
      pct: readiness.drawdown.breached ? 0 : 100,
      href: "/settings",
    },
  ];

  const metCount = milestones.filter((m) => m.met).length;
  const payoutEligible = metCount === milestones.length;
  const tierIndex = Math.min(metCount, TIER_NAMES.length - 1);
  const overallPct = (metCount / milestones.length) * 100;

  return (
    <>
      <PageHeader title="Ranks" description="Your real progress toward a Topstep payout — not a leaderboard, just your own milestones" />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          <Card className={cn(payoutEligible && "border-success/40 bg-success/5")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="size-5 text-primary" />
                    {TIER_NAMES[tierIndex]}
                  </CardTitle>
                  <CardDescription>{account.name} · {account.accountType.replace("_", " ")}</CardDescription>
                </div>
                <Badge variant={payoutEligible ? "success" : "secondary"}>
                  {metCount}/{milestones.length} milestones
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={overallPct} indicatorClassName={payoutEligible ? "bg-success" : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Every requirement Topstep actually checks before a payout</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {milestones.map((m) => (
                  <li key={m.label}>
                    <Link href={m.href} className="flex items-center gap-3 rounded-md py-1 transition-colors hover:bg-secondary/40">
                      {m.met ? (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                          <Check className="size-3.5" />
                        </span>
                      ) : (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Circle className="size-3.5" />
                        </span>
                      )}
                      <span className="flex-1">
                        <span className={cn("block text-sm", m.met ? "text-foreground" : "text-muted-foreground")}>
                          {m.label}
                        </span>
                        <Progress
                          value={Math.min(100, Math.max(0, m.pct))}
                          className="mt-1.5 h-1"
                          indicatorClassName={m.met ? "bg-success" : undefined}
                        />
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{m.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
