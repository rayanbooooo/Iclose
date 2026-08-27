"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NoteFormValues } from "@/lib/schemas/note";
import { NoteForm } from "./note-form";

export function NoteDialog({
  accountId,
  noteId,
  defaultValues,
}: {
  accountId: string;
  noteId?: string;
  defaultValues?: Partial<NoteFormValues>;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!noteId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus />
            Add note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "Add note"}</DialogTitle>
          <DialogDescription>Personal trading notes</DialogDescription>
        </DialogHeader>
        <NoteForm accountId={accountId} noteId={noteId} defaultValues={defaultValues} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
