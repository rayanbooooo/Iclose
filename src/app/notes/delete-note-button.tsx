"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteNote } from "./actions";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this note? This can't be undone.")) return;
        startTransition(async () => {
          await deleteNote(noteId);
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
