"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function startSession(accountId: string) {
  const existing = await db.tradingSession.findFirst({ where: { accountId, endedAt: null } });
  if (existing) return;
  await db.tradingSession.create({ data: { accountId } });
  revalidatePath("/session");
}

export async function endSession(sessionId: string, notes?: string) {
  await db.tradingSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date(), notes: notes || null },
  });
  revalidatePath("/session");
}
