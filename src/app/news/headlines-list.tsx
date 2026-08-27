"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";

export interface HeadlineItem {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  tickers: string[];
  date: string;
}

export function HeadlinesList({ articles }: { articles: HeadlineItem[] }) {
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  const allTickers = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) for (const t of a.tickers) set.add(t);
    return [...set].sort();
  }, [articles]);

  const filtered = activeTicker ? articles.filter((a) => a.tickers.includes(activeTicker)) : articles;

  return (
    <div className="space-y-4">
      {allTickers.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTicker(null)}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${!activeTicker ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            All
          </button>
          {allTickers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTicker(t === activeTicker ? null : t)}
              className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${activeTicker === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-4">
        {filtered.map((article) => (
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
    </div>
  );
}
