import { z } from "zod";

export const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Note can't be empty"),
  tradingDay: z.string().optional(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
