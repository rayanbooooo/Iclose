"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { noteFormSchema, type NoteFormValues } from "@/lib/schemas/note";
import { createNote, updateNote } from "./actions";

export function NoteForm({
  accountId,
  noteId,
  defaultValues,
  onSaved,
}: {
  accountId: string;
  noteId?: string;
  defaultValues?: Partial<NoteFormValues>;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { title: "", body: "", tradingDay: "", ...defaultValues },
  });

  const onSubmit = (values: NoteFormValues) => {
    startTransition(async () => {
      if (noteId) {
        await updateNote(noteId, values);
      } else {
        await createNote(accountId, values);
      }
      onSaved();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tradingDay">Trading day (optional)</Label>
        <Input id="tradingDay" type="date" {...register("tradingDay")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Note</Label>
        <Textarea id="body" rows={5} {...register("body")} />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : noteId ? "Save changes" : "Add note"}
      </Button>
    </form>
  );
}
