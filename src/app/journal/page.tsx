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
import { computeWinRate } from "@/lib/analytics";
import { formatCurrency, toDatetimeLocalValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/page-transition";
import { TradeDialog } from "./trade-dialog";
import { DeleteTradeButton } from "./delete-trade-button";

// Reads live trade data — must render per-request, not be baked in as a
// static page at build time.
export const dynamic = "force-dynamic";

type StatusFilter = "ALL" | "OPEN" | "CLOSED";
type DirectionFilter = "ALL" | "LONG" | "SHORT";

function FilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; direction?: string }>;
}) {
  const params = await searchParams;
  const status: StatusFilter = params.status === "OPEN" || params.status === "CLOSED" ? params.status : "ALL";
  const direction: DirectionFilter =
    params.direction === "LONG" || params.direction === "SHORT" ? params.direction : "ALL";

  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Journal" description="Logged trades and P&L" />
        <PageTransition>
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
        </PageTransition>
      </>
    );
  }

  const allTrades = await db.trade.findMany({
    where: { accountId: account.id },
    orderBy: { entryTime: "desc" },
  });

  const trades = allTrades.filter(
    (t) => (status === "ALL" || t.status === status) && (direction === "ALL" || t.direction === direction),
  );

  const winRate = computeWinRate(trades);
  const netPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  const buildHref = (next: Partial<{ status: StatusFilter; direction: DirectionFilter }>) => {
    const s = next.status ?? status;
    const d = next.direction ?? direction;
    const qs = new URLSearchParams();
    if (s !== "ALL") qs.set("status", s);
    if (d !== "ALL") qs.set("direction", d);
    const query = qs.toString();
    return query ? `/journal?${query}` : "/journal";
  };

  return (
    <>
      <PageHeader title="Journal" description="Logged trades and P&L" />
      <PageTransition>
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
              {(["ALL", "OPEN", "CLOSED"] as const).map((s) => (
                <FilterLink key={s} active={status === s} href={buildHref({ status: s })}>
                  {s === "ALL" ? "All" : s === "OPEN" ? "Open" : "Closed"}
                </FilterLink>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
              {(["ALL", "LONG", "SHORT"] as const).map((d) => (
                <FilterLink key={d} active={direction === d} href={buildHref({ direction: d })}>
                  {d === "ALL" ? "All" : d === "LONG" ? "Long" : "Short"}
                </FilterLink>
              ))}
            </div>
          </div>
          <TradeDialog accountId={account.id} />
        </div>

        {allTrades.length > 0 && (
          <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-sm">
            <span>
              <span className="text-muted-foreground">Showing </span>
              <span className="font-medium">{trades.length}</span>
              <span className="text-muted-foreground"> of {allTrades.length}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Win rate </span>
              <span className="font-medium">
                {winRate.total > 0 ? `${winRate.pct.toFixed(0)}%` : "—"}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Net P&amp;L </span>
              <span className={cn("font-medium", netPnl >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(netPnl)}
              </span>
            </span>
          </div>
        )}

        {allTrades.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No trades logged yet. Click &ldquo;Add trade&rdquo; to log your first one.
            </CardContent>
          </Card>
        ) : trades.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No trades match this filter.{" "}
              <Link href="/journal" className="text-primary underline">
                Clear filters
              </Link>
              .
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
      </PageTransition>
    </>
  );
}
