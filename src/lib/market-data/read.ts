import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  EconomicCalendarFileSchema,
  MarketSnapshotFileSchema,
  NewsFileSchema,
} from "./schema";

const DATA_DIR = path.join(process.cwd(), "data", "market");

async function readJson(file: string) {
  const raw = await readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw);
}

export async function getEconomicCalendar() {
  return EconomicCalendarFileSchema.parse(await readJson("economic-calendar.json"));
}

export async function getMarketNews() {
  return NewsFileSchema.parse(await readJson("news.json"));
}

export async function getMarketSnapshot() {
  return MarketSnapshotFileSchema.parse(await readJson("market-snapshot.json"));
}
