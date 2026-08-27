import "server-only";

import { z } from "zod";

/**
 * Real daily FX reference rates from the ECB via the free, keyless
 * Frankfurter API (https://frankfurter.dev) — no vendor quota to ration,
 * unlike the TipRanks-sourced snapshots. This is official daily reference
 * data, not an intraday tick feed: rates update once per ECB publishing day,
 * which is honestly labeled wherever it's shown rather than implied to be
 * live.
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

const RangeResponseSchema = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
});

export interface CurrencyMeta {
  code: string;
  name: string;
  lat: number;
  lng: number;
  /** true if conventionally quoted as CCY/USD (rate = USD per 1 unit); false if USD/CCY (rate = CCY per 1 USD). */
  usdIsQuote: boolean;
}

export const FX_CURRENCIES: CurrencyMeta[] = [
  { code: "EUR", name: "Euro", lat: 50.11, lng: 8.68, usdIsQuote: true },
  { code: "GBP", name: "British Pound", lat: 51.51, lng: -0.13, usdIsQuote: true },
  { code: "AUD", name: "Australian Dollar", lat: -35.28, lng: 149.13, usdIsQuote: true },
  { code: "NZD", name: "New Zealand Dollar", lat: -41.29, lng: 174.78, usdIsQuote: true },
  { code: "JPY", name: "Japanese Yen", lat: 35.68, lng: 139.69, usdIsQuote: false },
  { code: "CHF", name: "Swiss Franc", lat: 46.95, lng: 7.45, usdIsQuote: false },
  { code: "CAD", name: "Canadian Dollar", lat: 45.42, lng: -75.7, usdIsQuote: false },
  { code: "CNY", name: "Chinese Yuan", lat: 39.9, lng: 116.4, usdIsQuote: false },
  { code: "SEK", name: "Swedish Krona", lat: 59.33, lng: 18.06, usdIsQuote: false },
  { code: "NOK", name: "Norwegian Krone", lat: 59.91, lng: 10.75, usdIsQuote: false },
  { code: "PLN", name: "Polish Zloty", lat: 52.23, lng: 21.01, usdIsQuote: false },
  { code: "MXN", name: "Mexican Peso", lat: 19.43, lng: -99.13, usdIsQuote: false },
  { code: "BRL", name: "Brazilian Real", lat: -23.55, lng: -46.63, usdIsQuote: false },
  { code: "INR", name: "Indian Rupee", lat: 19.08, lng: 72.88, usdIsQuote: false },
  { code: "KRW", name: "South Korean Won", lat: 37.57, lng: 126.98, usdIsQuote: false },
  { code: "SGD", name: "Singapore Dollar", lat: 1.35, lng: 103.82, usdIsQuote: false },
  { code: "HKD", name: "Hong Kong Dollar", lat: 22.32, lng: 114.17, usdIsQuote: false },
  { code: "ZAR", name: "South African Rand", lat: -26.2, lng: 28.05, usdIsQuote: false },
  { code: "TRY", name: "Turkish Lira", lat: 41.01, lng: 28.98, usdIsQuote: false },
  { code: "ILS", name: "Israeli Shekel", lat: 32.08, lng: 34.78, usdIsQuote: false },
];

export interface FxQuote {
  pair: string;
  currency: string;
  rate: number;
  changePercentage: number;
}

export interface FxSnapshot {
  asOf: string;
  quotes: FxQuote[];
}

function displayRate(meta: CurrencyMeta, usdBaseRate: number): number {
  return meta.usdIsQuote ? 1 / usdBaseRate : usdBaseRate;
}

export async function getFxSnapshot(): Promise<FxSnapshot | null> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 9 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const symbols = FX_CURRENCIES.map((c) => c.code).join(",");
    const url = `${FRANKFURTER_BASE}/${fmt(start)}..${fmt(end)}?base=USD&symbols=${symbols}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const parsed = RangeResponseSchema.parse(await res.json());

    const dates = Object.keys(parsed.rates).sort();
    if (dates.length < 2) return null;
    const firstRates = parsed.rates[dates[0]];
    const lastRates = parsed.rates[dates[dates.length - 1]];
    const asOf = dates[dates.length - 1];

    const quotes: FxQuote[] = FX_CURRENCIES.filter(
      (meta) => lastRates[meta.code] !== undefined && firstRates[meta.code] !== undefined,
    ).map((meta) => {
      const startDisplay = displayRate(meta, firstRates[meta.code]);
      const endDisplay = displayRate(meta, lastRates[meta.code]);
      return {
        pair: meta.usdIsQuote ? `${meta.code}/USD` : `USD/${meta.code}`,
        currency: meta.code,
        rate: endDisplay,
        changePercentage: ((endDisplay - startDisplay) / startDisplay) * 100,
      };
    });

    if (quotes.length === 0) return null;
    return { asOf, quotes };
  } catch {
    return null;
  }
}
