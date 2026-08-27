"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resetTrades } from "./actions";

export function ResetTradesButton({
  accountId,
  tradeCount,
}: {
  accountId: string;
  tradeCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  if (tradeCount === 0) {
    return (
      <Button variant="outline" disabled>
        <Trash2 />
        No trades to reset
      </Button>
    );
  }

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        const ok = confirm(
          `Permanently delete all ${tradeCount} logged trade${tradeCount === 1 ? "" : "s"}? This cannot be undone. Your account and payout-rule settings are not affected.`,
        );
        if (!ok) return;
        startTransition(async () => {
          await resetTrades(accountId);
        });
      }}
    >
      <Trash2 />
      {isPending ? "Resetting…" : `Reset trades (${tradeCount})`}
    </Button>
  );
}
