import { getFxSnapshot } from "@/lib/market-data/fx";
import { getMarketSnapshot } from "@/lib/market-data/read";
import { Ticker, type TickerItem } from "@/components/ticker";

function formatRate(rate: number): string {
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: rate >= 10 ? 2 : 4,
    maximumFractionDigits: rate >= 10 ? 2 : 4,
  });
}

export async function MarketTicker() {
  const [fx, snapshot] = await Promise.all([
    getFxSnapshot(),
    getMarketSnapshot().catch(() => null),
  ]);

  const items: TickerItem[] = [];

  for (const idx of snapshot?.indices ?? []) {
    items.push({
      label: idx.name,
      value: idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      changePercentage: idx.changePercentage,
    });
  }

  for (const quote of fx?.quotes ?? []) {
    items.push({
      label: quote.pair,
      value: formatRate(quote.rate),
      changePercentage: quote.changePercentage,
    });
  }

  return <Ticker items={items} />;
}
