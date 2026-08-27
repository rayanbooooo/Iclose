import Link from "next/link";
import { Activity } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import {
  computeDirectionBreakdown,
  computeWeekdayBreakdown,
  detectOversizedLossDays,
  detectOvertradingDays,
  detectRevengeTrades,
} from "@/lib/analytics/patterns";
import { formatCurrency, formatEventTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PatternIntelPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Pattern Intel" description="Real patterns from your own trade history" />
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

  if (closedCount === 0) {
    return (
      <>
        <PageHeader title="Pattern Intel" description="Real patterns from your own trade history" />
        <PageTransition>
          <div className="p-6 md:p-8">
            <Card className="border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No closed trades yet. Patterns show up here once you&rsquo;ve logged some in the{" "}
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

  const weekdayStats = computeWeekdayBreakdown(trades).filter((d) => d.trades > 0);
  const directionStats = computeDirectionBreakdown(trades);
  const revengeFlags = detectRevengeTrades(trades);
  const oversizedDays = detectOversizedLossDays(trades, account.startingBalance);
  const overtradingDays = detectOvertradingDays(trades);

  return (
    <>
      <PageHeader title="Pattern Intel" description="Real patterns from your own trade history" />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" /> By day of week
                </CardTitle>
                <CardDescription>Win rate and net P&amp;L per weekday</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead className="text-right">Win rate</TableHead>
                      <TableHead className="text-right">Net P&amp;L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekdayStats.map((d) => (
                      <TableRow key={d.day}>
                        <TableCell className="font-medium">{d.day}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.trades}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.winRate.toFixed(0)}%</TableCell>
                        <TableCell
                          className={
                            "text-right tabular-nums " + (d.netPnl >= 0 ? "text-success" : "text-destructive")
                          }
                        >
                          {formatCurrency(d.netPnl)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By direction</CardTitle>
                <CardDescription>Long vs. short performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead className="text-right">Win rate</TableHead>
                      <TableHead className="text-right">Net P&amp;L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directionStats.map((d) => (
                      <TableRow key={d.direction}>
                        <TableCell>
                          <Badge variant={d.direction === "LONG" ? "success" : "destructive"}>
                            {d.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{d.trades}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.winRate.toFixed(0)}%</TableCell>
                        <TableCell
                          className={
                            "text-right tabular-nums " + (d.netPnl >= 0 ? "text-success" : "text-destructive")
                          }
                        >
                          {formatCurrency(d.netPnl)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk behavior flags</CardTitle>
              <CardDescription>
                Revenge trading, oversized-risk days, overtrading — detected from your actual trades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revengeFlags.length === 0 && oversizedDays.length === 0 && overtradingDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No risk-behavior patterns detected. Clean.</p>
              ) : (
                <>
                  {revengeFlags.map((f, i) => (
                    <div key={`revenge-${i}`} className="flex items-start gap-3 text-sm">
                      <Badge variant="destructive">Revenge</Badge>
                      <p className="text-muted-foreground">
                        New trade opened {f.minutesAfter.toFixed(0)}m after a {formatCurrency(f.triggerPnl)} loss (
                        {formatEventTime(f.triggerExitTime)}).
                      </p>
                    </div>
                  ))}
                  {oversizedDays.map((f) => (
                    <div key={`oversized-${f.day}`} className="flex items-start gap-3 text-sm">
                      <Badge variant="destructive">Oversized loss</Badge>
                      <p className="text-muted-foreground">
                        {f.day}: net {formatCurrency(f.pnl)} — exceeds 3% of starting balance in one day.
                      </p>
                    </div>
                  ))}
                  {overtradingDays.map((f) => (
                    <div key={`overtrading-${f.day}`} className="flex items-start gap-3 text-sm">
                      <Badge variant="secondary">Overtrading</Badge>
                      <p className="text-muted-foreground">
                        {f.day}: {f.count} trades — over 2x your median day ({f.medianCount}).
                      </p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
