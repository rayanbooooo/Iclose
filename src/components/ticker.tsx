"use client";

import { cn } from "@/lib/utils";

export interface TickerItem {
  label: string;
  value: string;
  changePercentage: number;
}

function TickerRow({ items, ariaHidden }: { items: TickerItem[]; ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`} className="flex items-center gap-2 px-5 py-2 text-xs whitespace-nowrap">
          <span className="font-semibold text-foreground">{item.label}</span>
          <span className="tabular-nums text-foreground/80">{item.value}</span>
          <span
            className={cn(
              "tabular-nums",
              item.changePercentage > 0 && "text-success",
              item.changePercentage < 0 && "text-destructive",
              item.changePercentage === 0 && "text-muted-foreground",
            )}
          >
            {item.changePercentage > 0 ? "+" : ""}
            {item.changePercentage.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden border-b border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="flex w-max animate-ticker">
        <TickerRow items={items} />
        <TickerRow items={items} ariaHidden />
      </div>
    </div>
  );
}
