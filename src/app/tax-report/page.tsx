import Link from "next/link";
import { FileText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { groupPnlByQuarter } from "@/lib/analytics/tax";
import { getTradingDay } from "@/lib/trading-day";
import { formatCurrency } from "@/lib/format";
import { CsvExportButton, type TaxCsvRow } from "./csv-export-button";

export const dynamic = "force-dynamic";

export default async function TaxReportPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Tax Report" description="Realized P&L by quarter" />
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

  const trades = await db.trade.findMany({
    where: { accountId: account.id },
    orderBy: { exitTime: "asc" },
  });
  const closed = trades.filter((t) => t.status === "CLOSED" && t.pnl !== null && t.exitTime !== null);
  const quarters = groupPnlByQuarter(trades);
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const totalFees = closed.reduce((sum, t) => sum + t.fees, 0);

  const csvRows: TaxCsvRow[] = closed.map((t) => ({
    date: getTradingDay(t.exitTime!),
    direction: t.direction,
    contracts: t.contracts,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice ?? 0,
    pnl: t.pnl ?? 0,
    fees: t.fees,
  }));

  return (
    <>
      <PageHeader title="Tax Report" description="Realized P&L by quarter, from your actual closed trades" />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          <p className="max-w-2xl text-xs text-muted-foreground">
            This is a summary of your logged trade data, not tax advice — verify against your broker&rsquo;s
            official statements and consult a tax professional before filing.
          </p>

          {closed.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No closed trades yet. Log some in the{" "}
                <Link href="/journal" className="text-primary underline">
                  Journal
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total realized P&amp;L</CardDescription>
                    <CardTitle className={totalPnl >= 0 ? "text-success" : "text-destructive"}>
                      {formatCurrency(totalPnl)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total fees</CardDescription>
                    <CardTitle>{formatCurrency(-totalFees)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Closed trades</CardDescription>
                    <CardTitle>{closed.length}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="size-4" /> By quarter
                      </CardTitle>
                      <CardDescription>Grouped by exchange-local (ET) trading day of exit</CardDescription>
                    </div>
                    <CsvExportButton rows={csvRows} filename={`mnq-trades-${account.name.replace(/\s+/g, "-")}.csv`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quarter</TableHead>
                        <TableHead className="text-right">Trades</TableHead>
                        <TableHead className="text-right">Fees</TableHead>
                        <TableHead className="text-right">Net P&amp;L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quarters.map((q) => (
                        <TableRow key={`${q.year}-Q${q.quarter}`}>
                          <TableCell className="font-medium">
                            {q.year} Q{q.quarter}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{q.trades}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(-q.fees)}
                          </TableCell>
                          <TableCell
                            className={
                              "text-right tabular-nums " + (q.netPnl >= 0 ? "text-success" : "text-destructive")
                            }
                          >
                            {formatCurrency(q.netPnl)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageTransition>
    </>
  );
}
