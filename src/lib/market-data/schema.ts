import { z } from "zod";

export const EconomicEventSchema = z.object({
  event: z.string(),
  country: z.string(),
  impact: z.enum(["High", "Medium", "Low"]),
  time: z.string(),
  actual: z.number().nullable(),
  estimate: z.number().nullable(),
  prev: z.number().nullable(),
  unit: z.string().nullable(),
});

export const EconomicCalendarFileSchema = z.object({
  syncedAt: z.string(),
  source: z.string(),
  events: z.array(EconomicEventSchema),
});

export const NewsArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  excerpt: z.string(),
  author: z.string(),
  category: z.string(),
  date: z.string(),
  url: z.string(),
  tickers: z.array(z.string()),
});

export const NewsFileSchema = z.object({
  syncedAt: z.string(),
  source: z.string(),
  articles: z.array(NewsArticleSchema),
});

export const IndexQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercentage: z.number(),
  dayLow: z.number(),
  dayHigh: z.number(),
});

export const MarketSentimentSchema = z.object({
  overallSentiment: z.string(),
  atmosphere: z.string(),
  keyThemes: z.array(z.string()),
  tailwinds: z.array(z.string()),
  headwinds: z.array(z.string()),
  generatedAt: z.string(),
});

export const MarketSnapshotFileSchema = z.object({
  syncedAt: z.string(),
  sentiment: MarketSentimentSchema,
  indices: z.array(IndexQuoteSchema),
});

export type EconomicCalendarFile = z.infer<typeof EconomicCalendarFileSchema>;
export type NewsFile = z.infer<typeof NewsFileSchema>;
export type MarketSnapshotFile = z.infer<typeof MarketSnapshotFileSchema>;
