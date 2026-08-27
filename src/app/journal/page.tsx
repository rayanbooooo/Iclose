import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { formatCurrency, toDatetimeLocalValue } from "@/lib/format";
import { TradeDialog } from "./trade-dialog";
import { DeleteTradeButton } from "./delete-trade-button";

// Reads live trade data — must render per-request, not be baked in as a
// static page at build time.
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Journal" description="Logged trades and P&L" />
        <div className="p-6 md:p-8">
          <Card className="max-w-md border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Set up your account in{" "}
              <Link href="/settings" className="text-primary underline">
                Settings
              </Link>{" "}
              before logging trades.
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

  return (
    <>
      <PageHeader title="Journal" description="Logged trades and P&L" />
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {trades.length} trade{trades.length === 1 ? "" : "s"}
          </p>
          <TradeDialog accountId={account.id} />
        </div>

        {trades.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No trades logged yet. Click &ldquo;Add trade&rdquo; to log your first one.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <Badge variant={trade.direction === "LONG" ? "success" : "destructive"}>
                          {trade.direction}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.contracts}</TableCell>
                      <TableCell>
                        <div>{trade.entryPrice}</div>
                        <div className="text-xs text-muted-foreground">
                          {trade.entryTime.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trade.exitPrice !== null ? (
                          <>
                            <div>{trade.exitPrice}</div>
                            <div className="text-xs text-muted-foreground">
                              {trade.exitTime?.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          trade.pnl === null
                            ? "text-muted-foreground"
                            : trade.pnl >= 0
                              ? "text-success"
                              : "text-destructive"
                        }
                      >
                        {trade.pnl === null ? "—" : formatCurrency(trade.pnl)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.status === "OPEN" ? "secondary" : "outline"}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                        {trade.tags ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TradeDialog
                            accountId={account.id}
                            tradeId={trade.id}
                            defaultValues={{
                              direction: trade.direction as "LONG" | "SHORT",
                              contracts: trade.contracts,
                              entryPrice: trade.entryPrice,
                              entryTime: toDatetimeLocalValue(trade.entryTime),
                              exitPrice: trade.exitPrice ?? undefined,
                              exitTime: trade.exitTime
                                ? toDatetimeLocalValue(trade.exitTime)
                                : undefined,
                              stopLoss: trade.stopLoss ?? undefined,
                              takeProfit: trade.takeProfit ?? undefined,
                              fees: trade.fees,
                              contractMultiplier: trade.contractMultiplier,
                              notes: trade.notes ?? undefined,
                              tags: trade.tags ?? undefined,
                            }}
                          />
                          <DeleteTradeButton tradeId={trade.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
