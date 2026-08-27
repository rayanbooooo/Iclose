import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEconomicCalendar, getMarketNews, getMarketSnapshot } from "@/lib/market-data/read";
import { formatEventTime, formatRelativeTime, formatSignedPercent } from "@/lib/format";
import { PageTransition } from "@/components/page-transition";
import { AnimatedNumber } from "@/components/animated-number";
import type { EconomicEventSchema } from "@/lib/market-data/schema";
import type { z } from "zod";

function impactVariant(impact: string) {
  if (impact === "High") return "destructive" as const;
  if (impact === "Medium") return "secondary" as const;
  return "outline" as const;
}

function groupByDay(events: z.infer<typeof EconomicEventSchema>[]) {
  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const key = new Date(event.time).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return groups;
}

export default async function NewsPage() {
  const [calendar, news, snapshot] = await Promise.all([
    getEconomicCalendar(),
    getMarketNews(),
    getMarketSnapshot(),
  ]);

  const eventGroups = groupByDay(calendar.events);

  return (
    <>
      <PageHeader
        title="News & Market"
        description="Synced periodically from TipRanks — not live. See last-synced times below."
      />
      <PageTransition>
      <div className="grid gap-4 p-6 md:p-8 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Market pulse</CardTitle>
                <CardDescription>
                  Synced {formatRelativeTime(snapshot.syncedAt)}
                </CardDescription>
              </div>
              <Badge variant={snapshot.sentiment.overallSentiment === "bullish" ? "success" : snapshot.sentiment.overallSentiment === "bearish" ? "destructive" : "secondary"}>
                {snapshot.sentiment.overallSentiment}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {snapshot.indices.map((idx) => (
                <div key={idx.symbol}>
                  <p className="text-xs text-muted-foreground">{idx.name}</p>
                  <p className="text-lg font-semibold tabular-nums">
                    <AnimatedNumber value={idx.price} decimals={2} />
                  </p>
                  <p
                    className={
                      "text-xs tabular-nums " +
                      (idx.change >= 0 ? "text-success" : "text-destructive")
                    }
                  >
                    {formatSignedPercent(idx.changePercentage)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{snapshot.sentiment.atmosphere}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Key themes</p>
                <ul className="space-y-1 text-xs text-foreground/80">
                  {snapshot.sentiment.keyThemes.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-success">Tailwinds</p>
                <ul className="space-y-1 text-xs text-foreground/80">
                  {snapshot.sentiment.tailwinds.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-destructive">Headwinds</p>
                <ul className="space-y-1 text-xs text-foreground/80">
                  {snapshot.sentiment.headwinds.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Economic calendar</CardTitle>
            <CardDescription>
              US · High/Medium impact · synced {formatRelativeTime(calendar.syncedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[...eventGroups.entries()].map(([day, events]) => (
                <div key={day}>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{day}</p>
                  <ul className="space-y-2.5">
                    {events.map((event, i) => (
                      <li key={`${event.event}-${event.time}-${i}`} className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{event.event}</span>
                          <Badge variant={impactVariant(event.impact)} className="shrink-0">
                            {event.impact}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-muted-foreground">
                          {formatEventTime(event.time)}
                          {event.actual !== null && (
                            <>
                              {" "}
                              · actual <span className="text-foreground">{event.actual}{event.unit ?? ""}</span>
                              {event.estimate !== null && <> (est {event.estimate}{event.unit ?? ""})</>}
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Headlines</CardTitle>
            <CardDescription>
              Nasdaq-100 megacaps · synced {formatRelativeTime(news.syncedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {news.articles.map((article) => (
                <li key={article.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-2 text-sm font-medium hover:underline"
                  >
                    {article.title}
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">{article.excerpt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {article.tickers.slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelativeTime(article.date.replace(" ", "T") + "Z")}
                    </span>
                  </div>
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
