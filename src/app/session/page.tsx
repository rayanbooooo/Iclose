import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { formatCurrency, formatEventTime } from "@/lib/format";
import { SessionTimer } from "./session-timer";
import { EndSessionButton, StartSessionButton } from "./session-controls";

export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function SessionPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Start Session" description="Track a live trading session" />
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

  const sessions = await db.tradingSession.findMany({
    where: { accountId: account.id },
    orderBy: { startedAt: "desc" },
  });
  const activeSession = sessions.find((s) => !s.endedAt);
  const pastSessions = sessions.filter((s) => s.endedAt);

  const trades = await db.trade.findMany({ where: { accountId: account.id } });

  function sessionStats(startedAt: Date, endedAt: Date | null) {
    const end = endedAt ?? new Date();
    const inWindow = trades.filter((t) => t.entryTime >= startedAt && t.entryTime <= end);
    const closed = inWindow.filter((t) => t.status === "CLOSED" && t.pnl !== null);
    const netPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    return { count: inWindow.length, netPnl };
  }

  return (
    <>
      <PageHeader title="Start Session" description="Track a live trading session and the trades logged during it" />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          <Card className={activeSession ? "border-primary/40 bg-primary/5" : undefined}>
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              {activeSession ? (
                <>
                  <Badge variant="success" className="gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-success-foreground" />
                    Session in progress
                  </Badge>
                  <SessionTimer startedAt={activeSession.startedAt.toISOString()} />
                  {(() => {
                    const stats = sessionStats(activeSession.startedAt, null);
                    return (
                      <p className="text-sm text-muted-foreground">
                        {stats.count} trade{stats.count === 1 ? "" : "s"} logged ·{" "}
                        <span className={stats.netPnl >= 0 ? "text-success" : "text-destructive"}>
                          {formatCurrency(stats.netPnl)}
                        </span>
                      </p>
                    );
                  })()}
                  <div className="w-full max-w-sm pt-2">
                    <EndSessionButton sessionId={activeSession.id} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No session running.</p>
                  <StartSessionButton accountId={account.id} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session history</CardTitle>
              <CardDescription>Past sessions and what happened during each</CardDescription>
            </CardHeader>
            <CardContent>
              {pastSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {pastSessions.map((s) => {
                    const stats = sessionStats(s.startedAt, s.endedAt);
                    return (
                      <li key={s.id} className="space-y-1 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{formatEventTime(s.startedAt.toISOString())}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(s.endedAt!.getTime() - s.startedAt.getTime())}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {stats.count} trade{stats.count === 1 ? "" : "s"}
                          </span>
                          <span className={stats.netPnl >= 0 ? "text-success" : "text-destructive"}>
                            {formatCurrency(stats.netPnl)}
                          </span>
                        </div>
                        {s.notes && <p className="pt-1 text-xs text-muted-foreground">{s.notes}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
