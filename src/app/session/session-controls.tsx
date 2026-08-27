"use client";

import { useState, useTransition } from "react";
import { Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { startSession, endSession } from "./actions";

export function StartSessionButton({ accountId }: { accountId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      disabled={isPending}
      onClick={() => startTransition(async () => await startSession(accountId))}
    >
      <Play className="size-4" />
      {isPending ? "Starting…" : "Start session"}
    </Button>
  );
}

export function EndSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="How did the session go? (optional)"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button
        variant="destructive"
        disabled={isPending}
        onClick={() => startTransition(async () => await endSession(sessionId, notes))}
      >
        <Square className="size-4" />
        {isPending ? "Ending…" : "End session"}
      </Button>
    </div>
  );
}
