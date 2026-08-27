import { Fragment } from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getEconomicCalendar, getMarketNews, getMarketSnapshot } from "@/lib/market-data/read";
import { formatRelativeTime, formatSignedPercent } from "@/lib/format";
import { PageTransition } from "@/components/page-transition";
import { AnimatedNumber } from "@/components/animated-number";
import { HeadlinesList } from "./headlines-list";
import type { EconomicEventSchema } from "@/lib/market-data/schema";
import type { z } from "zod";

const IMPACT_DOT: Record<string, string> = {
  High: "bg-destructive",
  Medium: "bg-chart-5",
  Low: "bg-muted-foreground",
};

function todayEtKey(now = new Date()) {
  return now.toLocaleDateString("en-US", { timeZone: "America/New_York" });
}

function groupByDay(events: z.infer<typeof EconomicEventSchema>[]) {
  const groups = new Map<
    string,
    { label: string; dateKey: string; events: typeof events }
  >();
  for (const event of events) {
    const date = new Date(event.time);
    const dateKey = date.toLocaleDateString("en-US", { timeZone: "America/New_York" });
    const label = date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups.has(dateKey)) groups.set(dateKey, { label, dateKey, events: [] });
    groups.get(dateKey)!.events.push(event);
  }
  return [...groups.values()];
}

export default async function NewsPage() {
  const [calendar, news, snapshot] = await Promise.all([
    getEconomicCalendar(),
    getMarketNews(),
    getMarketSnapshot(),
  ]);

  const eventGroups = groupByDay(calendar.events);
  const today = todayEtKey();

  return (
    <>
      <PageHeader
        title="News & Market"
        description="Synced periodically from TipRanks — not live. See last-synced times below."
      />
      <PageTransition>
      <div className="space-y-4 p-6 md:p-8">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Economic calendar</CardTitle>
            <CardDescription>
              US · High/Medium impact · synced {formatRelativeTime(calendar.syncedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="mb-3 flex items-center gap-4 px-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive" /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-5" /> Medium
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Time</TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventGroups.map((group) => (
                  <Fragment key={group.dateKey}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className={cn(
                          "bg-muted/40 py-1.5 text-xs font-semibold tracking-wide text-foreground/80",
                          group.dateKey === today && "text-primary",
                        )}
                      >
                        {group.label}
                        {group.dateKey === today && (
                          <Badge variant="outline" className="ml-2 border-primary/40 text-primary">
                            Today
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {group.events.map((event, i) => (
                      <TableRow key={`${group.dateKey}-${event.event}-${i}`}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(event.time).toLocaleTimeString("en-US", {
                            timeZone: "America/New_York",
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          ET
                        </TableCell>
                        <TableCell>
                          <span
                            title={event.impact}
                            className={cn(
                              "inline-block size-2 rounded-full",
                              IMPACT_DOT[event.impact] ?? "bg-muted-foreground",
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium">{event.event}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {event.actual !== null ? (
                            <span className="font-medium">
                              {event.actual}
                              {event.unit ?? ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {event.estimate !== null ? `${event.estimate}${event.unit ?? ""}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {event.prev !== null ? `${event.prev}${event.unit ?? ""}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headlines</CardTitle>
            <CardDescription>
              Nasdaq-100 megacaps · synced {formatRelativeTime(news.syncedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HeadlinesList articles={news.articles} />
          </CardContent>
        </Card>
      </div>
      </PageTransition>
    </>
  );
}
