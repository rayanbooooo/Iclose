"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatMoney } from "@/lib/format";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function TradingCalendar({
  dailyPnl,
}: {
  dailyPnl: { day: string; pnl: number; trades: number }[];
}) {
  const [cursor, setCursor] = useState(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, { pnl: number; trades: number }>();
    for (const d of dailyPnl) map.set(d.day, { pnl: d.pnl, trades: d.trades });
    return map;
  }, [dailyPnl]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthTotal = { pnl: 0, trades: 0 };
  for (const d of dailyPnl) {
    const date = parseYmd(d.day);
    if (date >= monthStart && date <= monthEnd) {
      monthTotal.pnl += d.pnl;
      monthTotal.trades += d.trades;
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Monthly P&amp;L</p>
          <p
            className={cn(
              "text-xl font-semibold tabular-nums",
              monthTotal.pnl >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {formatCurrency(monthTotal.pnl)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {monthTotal.trades} trade{monthTotal.trades === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-32 text-center text-sm font-medium">{format(cursor, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-2" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-1 pb-1 text-center text-xs text-muted-foreground">
            {label}
          </div>
        ))}

        {weeks.map((week, weekIndex) => {
          const weekTotal = week.reduce(
            (acc, day) => {
              const entry = byDay.get(ymd(day));
              if (entry) {
                acc.pnl += entry.pnl;
                acc.trades += entry.trades;
              }
              return acc;
            },
            { pnl: 0, trades: 0 },
          );

          return week.map((day, dayIndex) => {
            const key = ymd(day);
            const inMonth = isSameMonth(day, cursor);
            const entry = inMonth ? byDay.get(key) : undefined;
            const isSaturday = dayIndex === 6;
            const today = isToday(day);

            if (isSaturday) {
              const hasWeekData = weekTotal.trades > 0;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-20 flex-col justify-between rounded-md border border-border/60 bg-secondary/40 p-2",
                    !inMonth && weekIndex === 0 && "opacity-40",
                  )}
                >
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                    Week {weekIndex + 1}
                  </span>
                  {hasWeekData ? (
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          weekTotal.pnl >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {formatMoney(weekTotal.pnl)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {weekTotal.trades} trade{weekTotal.trades === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No trades</p>
                  )}
                </div>
              );
            }

            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-20 flex-col justify-between rounded-md border p-2",
                  inMonth ? "border-border/60" : "border-transparent",
                  today && "border-primary/50 bg-primary/5",
                  !entry && inMonth && "bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "text-xs",
                    inMonth ? "text-foreground/70" : "text-muted-foreground/30",
                    today && "font-semibold text-primary",
                  )}
                >
                  {format(day, "d")}
                </span>
                {entry && (
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        entry.pnl >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatMoney(entry.pnl)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.trades} trade{entry.trades === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
