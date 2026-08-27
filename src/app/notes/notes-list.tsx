"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NoteDialog } from "./note-dialog";
import { DeleteNoteButton } from "./delete-note-button";

export interface NoteListItem {
  id: string;
  title: string;
  body: string;
  tradingDay: string | null;
}

export function NotesList({ accountId, notes }: { accountId: string; notes: NoteListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tradingDay?.includes(q),
    );
  }, [notes, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <NoteDialog accountId={accountId} />
      </div>

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 pt-6 pb-8 text-center text-sm text-muted-foreground">
            <ClipboardList className="size-6" />
            No notes yet. Add one above.
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No notes match &ldquo;{query}&rdquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card key={note.id}>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{note.title}</p>
                    {note.tradingDay && (
                      <p className="text-xs text-muted-foreground">{note.tradingDay}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <NoteDialog
                      accountId={accountId}
                      noteId={note.id}
                      defaultValues={{
                        title: note.title,
                        body: note.body,
                        tradingDay: note.tradingDay ?? "",
                      }}
                    />
                    <DeleteNoteButton noteId={note.id} />
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
