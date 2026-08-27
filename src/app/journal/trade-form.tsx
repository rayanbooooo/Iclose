"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  tradeFormSchema,
  type TradeFormValues,
  type TradeFormInput,
} from "@/lib/schemas/trade";
import { createTrade, updateTrade } from "./actions";

export function TradeForm({
  accountId,
  tradeId,
  defaultValues,
  onSaved,
}: {
  accountId: string;
  tradeId?: string;
  defaultValues?: Partial<TradeFormInput>;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TradeFormInput, unknown, TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      direction: "LONG",
      contracts: 1,
      fees: 0,
      contractMultiplier: 2,
      ...defaultValues,
    },
  });

  const onSubmit = (values: TradeFormValues) => {
    startTransition(async () => {
      if (tradeId) {
        await updateTrade(tradeId, values);
      } else {
        await createTrade(accountId, values);
      }
      onSaved();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="direction">Direction</Label>
          <Select id="direction" {...register("direction")}>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contracts">Contracts</Label>
          <Input id="contracts" type="number" {...register("contracts")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="entryPrice">Entry price</Label>
          <Input id="entryPrice" type="number" step="any" {...register("entryPrice")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="entryTime">Entry time</Label>
          <Input id="entryTime" type="datetime-local" {...register("entryTime")} />
          {errors.entryTime && (
            <p className="text-xs text-destructive">{errors.entryTime.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exitPrice">Exit price</Label>
          <Input id="exitPrice" type="number" step="any" {...register("exitPrice")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exitTime">Exit time</Label>
          <Input id="exitTime" type="datetime-local" {...register("exitTime")} />
          {errors.exitPrice && (
            <p className="text-xs text-destructive">{errors.exitPrice.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stopLoss">Stop loss</Label>
          <Input id="stopLoss" type="number" step="any" {...register("stopLoss")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="takeProfit">Take profit</Label>
          <Input id="takeProfit" type="number" step="any" {...register("takeProfit")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fees">Fees ($)</Label>
          <Input id="fees" type="number" step="any" {...register("fees")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contractMultiplier">$ / point</Label>
          <Input
            id="contractMultiplier"
            type="number"
            step="any"
            {...register("contractMultiplier")}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="breakout, retest, ..." {...register("tags")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : tradeId ? "Save changes" : "Add trade"}
      </Button>
    </form>
  );
}
