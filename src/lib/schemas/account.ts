import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.enum(["COMBINE", "EXPRESS_FUNDED"]),
  startingBalance: z.coerce.number().positive(),
  profitTarget: z.coerce.number().positive(),
  trailingDrawdown: z.coerce.number().positive(),
  drawdownMode: z.enum(["EOD_TRAILING_LOCK_AT_START", "INTRADAY_TRAILING"]),
  consistencyRulePct: z.coerce.number().positive().max(100),
  minWinningDays: z.coerce.number().int().min(0),
  minWinningDayAmount: z.coerce.number().min(0),
  minTradingDays: z.coerce.number().int().min(0),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
