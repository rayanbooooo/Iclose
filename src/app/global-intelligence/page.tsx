import { Globe as GlobeIcon, TrendingDown, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FxGlobeLoader } from "@/components/globe/fx-globe-loader";
import type { GlobeMarker } from "@/components/globe/fx-globe";
import { FX_CURRENCIES, getFxSnapshot } from "@/lib/market-data/fx";
import { getEconomicCalendar, getMarketSnapshot } from "@/lib/market-data/read";
import { formatRelativeTime, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const US_MARKER = { lat: 38.9, lng: -77.04 };

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

  const markers: GlobeMarker[] = [];

  for (const quote of fx?.quotes ?? []) {
    const meta = FX_CURRENCIES.find((c) => c.code === quote.currency);
    if (!meta) continue;
    const rateStr = quote.rate.toFixed(quote.rate >= 10 ? 2 : 4);
    markers.push({
      lat: meta.lat,
      lng: meta.lng,
      code: meta.code,
      pair: quote.pair,
      displayValue: rateStr,
      tooltip: `${quote.pair} · ${rateStr} (${formatSignedPercent(quote.changePercentage)})`,
      changePercentage: quote.changePercentage,
    });
  }

  markers.push({
    lat: US_MARKER.lat,
    lng: US_MARKER.lng,
    code: "US",
    pair: "US",
    displayValue: `${todaysEvents.length} events`,
    tooltip: `US · ${todaysEvents.length} econ event${todaysEvents.length === 1 ? "" : "s"} today (${highImpactToday} high-impact)`,
    changePercentage: null,
    isHome: true,
  });

  const biggestMover = [...(fx?.quotes ?? [])].sort(
    (a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage),
  )[0];

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

          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.primary/12%),transparent_65%)]" />
            <CardContent className="relative px-0 pt-0 pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-0">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="relative inline-flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      Global FX situation
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drag to rotate. Pulses scale with today&rsquo;s move — green up, red down.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {biggestMover && (
                    <Badge
                      variant={biggestMover.changePercentage >= 0 ? "success" : "destructive"}
                      className="gap-1"
                    >
                      {biggestMover.changePercentage >= 0 ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {biggestMover.pair} {formatSignedPercent(biggestMover.changePercentage)}
                    </Badge>
                  )}
                  {fx && <Badge variant="outline">ECB rates as of {fx.asOf}</Badge>}
                </div>
              </div>
              <FxGlobeLoader points={markers} />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Markets tracked</CardDescription>
                <CardTitle>{markers.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>US events today</CardDescription>
                <CardTitle>{todaysEvents.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>High-impact today</CardDescription>
                <CardTitle className={highImpactToday > 0 ? "text-destructive" : undefined}>
                  {highImpactToday}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GlobeIcon className="size-4" /> FX pulse
                </CardTitle>
                <CardDescription>Daily ECB reference rates vs. USD</CardDescription>
              </CardHeader>
              <CardContent>
                {!fx || fx.quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">FX data unavailable right now.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {fx.quotes.map((quote) => (
                      <li key={quote.pair} className="flex items-center justify-between py-2 text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              quote.changePercentage > 0 && "bg-success",
                              quote.changePercentage < 0 && "bg-destructive",
                              quote.changePercentage === 0 && "bg-muted-foreground",
                            )}
                          />
                          {quote.pair}
                        </span>
                        <span className="tabular-nums text-foreground/80">
                          {quote.rate.toFixed(quote.rate >= 10 ? 2 : 4)}
                        </span>
                        <span
                          className={cn(
                            "tabular-nums text-xs",
                            quote.changePercentage > 0 && "text-success",
                            quote.changePercentage < 0 && "text-destructive",
                            quote.changePercentage === 0 && "text-muted-foreground",
                          )}
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
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              event.impact === "High" && "bg-destructive",
                              event.impact === "Medium" && "bg-chart-5",
                              event.impact === "Low" && "bg-muted-foreground",
                            )}
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
