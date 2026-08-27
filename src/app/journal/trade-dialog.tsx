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
import type { TradeFormInput } from "@/lib/schemas/trade";
import { TradeForm } from "./trade-form";

export function TradeDialog({
  accountId,
  tradeId,
  defaultValues,
}: {
  accountId: string;
  tradeId?: string;
  defaultValues?: Partial<TradeFormInput>;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!tradeId;

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
            Add trade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit trade" : "Add trade"}</DialogTitle>
          <DialogDescription>MNQ · logged manually</DialogDescription>
        </DialogHeader>
        <TradeForm
          accountId={accountId}
          tradeId={tradeId}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
