import { Globe as GlobeIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FxGlobeLoader } from "@/components/globe/fx-globe-loader";
import type { GlobePoint } from "@/components/globe/fx-globe";
import { FX_CURRENCIES, getFxSnapshot } from "@/lib/market-data/fx";
import { getEconomicCalendar, getMarketSnapshot } from "@/lib/market-data/read";
import { formatRelativeTime, formatSignedPercent } from "@/lib/format";

const US_MARKER = { lat: 38.9, lng: -77.04 };

function magnitudeRadius(pct: number): number {
  return 0.35 + Math.min(Math.abs(pct) * 0.5, 1.1);
}

export const revalidate = 3600;

export default async function GlobalIntelligencePage() {
  const [fx, calendar, snapshot] = await Promise.all([
    getFxSnapshot(),
    getEconomicCalendar(),
    getMarketSnapshot(),
  ]);

  const todayEt = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const todaysEvents = calendar.events.filter(
    (e) => new Date(e.time).toLocaleDateString("en-US", { timeZone: "America/New_York" }) === todayEt,
  );
  const highImpactToday = todaysEvents.filter((e) => e.impact === "High").length;

  const points: GlobePoint[] = [];

  for (const quote of fx?.quotes ?? []) {
    const meta = FX_CURRENCIES.find((c) => c.code === quote.currency);
    if (!meta) continue;
    const color = quote.changePercentage > 0 ? "#22c55e" : quote.changePercentage < 0 ? "#ef4444" : "#a8a8bd";
    points.push({
      lat: meta.lat,
      lng: meta.lng,
      color,
      radius: magnitudeRadius(quote.changePercentage),
      label: `${quote.pair} · ${quote.rate.toFixed(quote.rate >= 10 ? 2 : 4)} (${formatSignedPercent(quote.changePercentage)})`,
    });
  }

  points.push({
    lat: US_MARKER.lat,
    lng: US_MARKER.lng,
    color: highImpactToday > 0 ? "#a78bfa" : "#38bdf8",
    radius: 0.5 + Math.min(todaysEvents.length * 0.15, 1),
    label: `US · ${todaysEvents.length} econ event${todaysEvents.length === 1 ? "" : "s"} today (${highImpactToday} high-impact)`,
  });

  return (
    <>
      <PageHeader
        title="Global Intelligence"
        description="Real ECB daily FX reference rates + US economic calendar activity, mapped"
      />
      <PageTransition>
        <div className="space-y-4 p-6 md:p-8">
          {!fx && (
            <Card className="border-dashed border-destructive/40 bg-destructive/5">
              <CardContent className="py-3 text-xs text-muted-foreground">
                FX data is temporarily unavailable — the globe is showing US economic-calendar
                activity only. This refreshes automatically once the ECB feed responds again.
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GlobeIcon className="size-4.5 text-primary" />
                    Global FX situation
                  </CardTitle>
                  <CardDescription>
                    Drag to rotate. Marker size = magnitude of today&rsquo;s move. Green = up, red = down.
                  </CardDescription>
                </div>
                {fx && (
                  <Badge variant="outline">
                    ECB rates as of {fx.asOf}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <FxGlobeLoader points={points} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>FX pulse</CardTitle>
                <CardDescription>Daily ECB reference rates vs. USD</CardDescription>
              </CardHeader>
              <CardContent>
                {!fx || fx.quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">FX data unavailable right now.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {fx.quotes.map((quote) => (
                      <li key={quote.pair} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-medium">{quote.pair}</span>
                        <span className="tabular-nums text-foreground/80">
                          {quote.rate.toFixed(quote.rate >= 10 ? 2 : 4)}
                        </span>
                        <span
                          className={
                            "tabular-nums text-xs " +
                            (quote.changePercentage > 0
                              ? "text-success"
                              : quote.changePercentage < 0
                                ? "text-destructive"
                                : "text-muted-foreground")
                          }
                        >
                          {formatSignedPercent(quote.changePercentage)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>US macro today</CardTitle>
                <CardDescription>
                  Synced {formatRelativeTime(calendar.syncedAt)} · relevant to MNQ/Nasdaq-100
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todaysEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No US economic events scheduled today.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {todaysEvents.map((event, i) => (
                      <li key={`${event.event}-${i}`} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className={
                              "size-1.5 shrink-0 rounded-full " +
                              (event.impact === "High"
                                ? "bg-destructive"
                                : event.impact === "Medium"
                                  ? "bg-chart-5"
                                  : "bg-muted-foreground")
                            }
                          />
                          {event.event}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.time).toLocaleTimeString("en-US", {
                            timeZone: "America/New_York",
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          ET
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Market sentiment</CardTitle>
              <CardDescription>Synced {formatRelativeTime(snapshot.syncedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Badge
                variant={
                  snapshot.sentiment.overallSentiment === "bullish"
                    ? "success"
                    : snapshot.sentiment.overallSentiment === "bearish"
                      ? "destructive"
                      : "secondary"
                }
              >
                {snapshot.sentiment.overallSentiment}
              </Badge>
              <p className="text-sm text-muted-foreground">{snapshot.sentiment.atmosphere}</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
