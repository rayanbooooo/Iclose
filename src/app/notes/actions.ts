"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { noteFormSchema, type NoteFormValues } from "@/lib/schemas/note";

export async function createNote(accountId: string, values: NoteFormValues) {
  const parsed = noteFormSchema.parse(values);
  await db.note.create({
    data: { ...parsed, tradingDay: parsed.tradingDay || null, accountId },
  });
  revalidatePath("/notes");
}

export async function updateNote(id: string, values: NoteFormValues) {
  const parsed = noteFormSchema.parse(values);
  await db.note.update({
    where: { id },
    data: { ...parsed, tradingDay: parsed.tradingDay || null },
  });
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  await db.note.delete({ where: { id } });
  revalidatePath("/notes");
}
