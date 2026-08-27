import Link from "next/link";
import { Award, Check, Circle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    { label: "Trading days requirement met", met: readiness.tradingDays.met, detail: `${readiness.tradingDays.count}/${readiness.tradingDays.required} days` },
    { label: "Winning days requirement met", met: readiness.winningDays.met, detail: `${readiness.winningDays.count}/${readiness.winningDays.required} days` },
    { label: "Profit target reached", met: readiness.profitTarget.met, detail: `${formatPct(readiness.profitTarget.pct)}% of target` },
    { label: "Consistency rule passing", met: readiness.consistency.status === "PASS", detail: readiness.consistency.status.replace("_", " ") },
    { label: "Drawdown not breached", met: !readiness.drawdown.breached, detail: readiness.drawdown.breached ? "breached" : "clear" },
  ];

  const metCount = milestones.filter((m) => m.met).length;
  const payoutEligible = metCount === milestones.length;
  const tierIndex = Math.min(metCount, TIER_NAMES.length - 1);

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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Every requirement Topstep actually checks before a payout</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {milestones.map((m) => (
                  <li key={m.label} className="flex items-center gap-3">
                    {m.met ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Circle className="size-3.5" />
                      </span>
                    )}
                    <span className={cn("flex-1 text-sm", m.met ? "text-foreground" : "text-muted-foreground")}>
                      {m.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.detail}</span>
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

function formatPct(pct: number): string {
  return pct.toFixed(0);
}
