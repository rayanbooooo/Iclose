import { CandlestickChart, TrendingDown, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { TradingChart } from "@/components/chart/trading-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateSampleCandles } from "@/lib/data-providers/sample-provider";
import { DEFAULT_STRATEGY_CONFIG, runStrategy } from "@/lib/strategy-engine/engine";
import { formatEventTime, formatMoney } from "@/lib/format";

export default function ChartPage() {
  const candles = generateSampleCandles();
  const { swingPoints, signals } = runStrategy(candles, DEFAULT_STRATEGY_CONFIG);
  const recentSignals = [...signals].reverse().slice(0, 8);

  return (
    <>
      <PageHeader
        title="Chart"
        description="MNQ · 15m · swing-high/low breakout + retest strategy"
      />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          <Card className="border-dashed border-chart-5/40 bg-chart-5/5">
            <CardContent className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
              <CandlestickChart className="size-3.5 shrink-0 text-chart-5" />
              Running the strategy engine against generated sample MNQ 15m data — not a live feed.
              Real market data is a later phase once a data vendor is picked.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>MNQ · 15m</CardTitle>
                  <CardDescription>
                    Dashed lines mark active swing highs/lows; arrows mark strategy signals.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded-full bg-[#a78bfa]" /> Swing high
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded-full bg-[#38bdf8]" /> Swing low
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-success" /> Long
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="size-3.5 text-destructive" /> Short
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TradingChart candles={candles} swingPoints={swingPoints} signals={signals} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Swing points detected</CardDescription>
                <CardTitle>{swingPoints.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Signals generated</CardDescription>
                <CardTitle>{signals.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Strategy config</CardDescription>
                <CardTitle className="text-sm font-medium text-foreground/80">
                  {DEFAULT_STRATEGY_CONFIG.lookbackPeriod}-bar lookback ·{" "}
                  {DEFAULT_STRATEGY_CONFIG.mirroredEnabled ? "mirrored on" : "mirrored off"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent signals</CardTitle>
              <CardDescription>Most recent breakout/retest triggers from this run</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSignals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No signals fired against this sample data window.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentSignals.map((signal) => (
                    <li
                      key={`${signal.index}-${signal.swingPoint.pivotIndex}`}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <Badge variant={signal.direction === "LONG" ? "success" : "destructive"}>
                          {signal.direction}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {signal.kind === "BREAKOUT" ? "Breakout" : "Retest"}
                        </span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{formatMoney(signal.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEventTime(new Date(signal.time * 1000).toISOString())}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
