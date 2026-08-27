"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { computeTradePnl } from "@/lib/pnl";
import { tradeFormSchema, type TradeFormValues } from "@/lib/schemas/trade";

function toTradeData(values: TradeFormValues) {
  const parsed = tradeFormSchema.parse(values);
  const isClosed = parsed.exitPrice !== undefined && !!parsed.exitTime;
  const pnl = isClosed
    ? computeTradePnl({
        direction: parsed.direction,
        entryPrice: parsed.entryPrice,
        exitPrice: parsed.exitPrice as number,
        contracts: parsed.contracts,
        contractMultiplier: parsed.contractMultiplier,
        fees: parsed.fees,
      })
    : null;

  return {
    direction: parsed.direction,
    contracts: parsed.contracts,
    entryPrice: parsed.entryPrice,
    entryTime: new Date(parsed.entryTime),
    exitPrice: parsed.exitPrice ?? null,
    exitTime: parsed.exitTime ? new Date(parsed.exitTime) : null,
    stopLoss: parsed.stopLoss ?? null,
    takeProfit: parsed.takeProfit ?? null,
    fees: parsed.fees,
    contractMultiplier: parsed.contractMultiplier,
    pnl,
    status: isClosed ? "CLOSED" : "OPEN",
    notes: parsed.notes || null,
    tags: parsed.tags || null,
  };
}

function revalidateTradeDependentPaths() {
  revalidatePath("/journal");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/pattern-intel");
  revalidatePath("/coach");
  revalidatePath("/ranks");
  revalidatePath("/tax-report");
}

export async function createTrade(accountId: string, values: TradeFormValues) {
  const data = toTradeData(values);
  await db.trade.create({ data: { ...data, accountId, symbol: "MNQ" } });
  revalidateTradeDependentPaths();
}

export async function updateTrade(id: string, values: TradeFormValues) {
  const data = toTradeData(values);
  await db.trade.update({ where: { id }, data });
  revalidateTradeDependentPaths();
}

export async function deleteTrade(id: string) {
  await db.trade.delete({ where: { id } });
  revalidateTradeDependentPaths();
}
