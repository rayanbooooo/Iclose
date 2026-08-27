"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { accountFormSchema, type AccountFormValues } from "@/lib/schemas/account";

export async function upsertAccount(values: AccountFormValues) {
  const parsed = accountFormSchema.parse(values);
  const existing = await db.account.findFirst({ where: { isActive: true } });

  const accountData = {
    name: parsed.name,
    accountType: parsed.accountType,
    startingBalance: parsed.startingBalance,
    profitTarget: parsed.profitTarget,
    trailingDrawdown: parsed.trailingDrawdown,
    drawdownMode: parsed.drawdownMode,
  };

  const account = existing
    ? await db.account.update({ where: { id: existing.id }, data: accountData })
    : await db.account.create({
        data: {
          ...accountData,
          currentBalance: parsed.startingBalance,
          highWaterMark: parsed.startingBalance,
        },
      });

  await db.payoutRule.upsert({
    where: { accountId: account.id },
    create: {
      accountId: account.id,
      consistencyRulePct: parsed.consistencyRulePct,
      minWinningDays: parsed.minWinningDays,
      minWinningDayAmount: parsed.minWinningDayAmount,
      minTradingDays: parsed.minTradingDays,
    },
    update: {
      consistencyRulePct: parsed.consistencyRulePct,
      minWinningDays: parsed.minWinningDays,
      minWinningDayAmount: parsed.minWinningDayAmount,
      minTradingDays: parsed.minTradingDays,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
}

/**
 * Deletes all trades for the account. Leaves the account and payout-rule
 * config untouched — this is a journal reset, not an account reset.
 */
export async function resetTrades(accountId: string) {
  await db.trade.deleteMany({ where: { accountId } });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
}
