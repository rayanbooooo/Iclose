"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteTrade } from "./actions";

export function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this trade? This can't be undone.")) return;
        startTransition(async () => {
          await deleteTrade(tradeId);
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
