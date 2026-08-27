import { z } from "zod";

const optionalPositiveNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional(),
);

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional(),
);

export const tradeFormSchema = z
  .object({
    direction: z.enum(["LONG", "SHORT"]),
    contracts: z.coerce.number().int().positive(),
    entryPrice: z.coerce.number().positive(),
    entryTime: z.string().min(1, "Entry time is required"),
    exitPrice: optionalPositiveNumber,
    exitTime: z.string().optional(),
    stopLoss: optionalNumber,
    takeProfit: optionalNumber,
    fees: z.coerce.number().min(0).default(0),
    contractMultiplier: z.coerce.number().positive().default(2),
    notes: z.string().optional(),
    tags: z.string().optional(),
  })
  .refine((data) => (data.exitPrice !== undefined) === (!!data.exitTime), {
    message: "Exit price and exit time must be set together",
    path: ["exitPrice"],
  });

export type TradeFormValues = z.output<typeof tradeFormSchema>;
export type TradeFormInput = z.input<typeof tradeFormSchema>;
