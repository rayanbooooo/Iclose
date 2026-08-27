"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { accountFormSchema, type AccountFormValues } from "@/lib/schemas/account";
import { upsertAccount } from "./actions";

const DEFAULTS: AccountFormValues = {
  name: "Topstep 50K Combine",
  accountType: "COMBINE",
  startingBalance: 50000,
  profitTarget: 3000,
  trailingDrawdown: 2000,
  drawdownMode: "EOD_TRAILING_LOCK_AT_START",
  consistencyRulePct: 50,
  minWinningDays: 5,
  minWinningDayAmount: 150,
  minTradingDays: 0,
};

export function AccountForm({ defaultValues }: { defaultValues?: Partial<AccountFormValues> }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
  });

  const onSubmit = (values: AccountFormValues) => {
    setSaved(false);
    startTransition(async () => {
      await upsertAccount(values);
      setSaved(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Account name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountType">Account type</Label>
          <Select id="accountType" {...register("accountType")}>
            <option value="COMBINE">Combine (evaluation)</option>
            <option value="EXPRESS_FUNDED">Express Funded</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startingBalance">Starting balance ($)</Label>
          <Input id="startingBalance" type="number" step="any" {...register("startingBalance")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profitTarget">Profit target ($)</Label>
          <Input id="profitTarget" type="number" step="any" {...register("profitTarget")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trailingDrawdown">Trailing max drawdown ($)</Label>
          <Input id="trailingDrawdown" type="number" step="any" {...register("trailingDrawdown")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawdownMode">Drawdown mode</Label>
          <Select id="drawdownMode" {...register("drawdownMode")}>
            <option value="EOD_TRAILING_LOCK_AT_START">EOD trailing, locks at start</option>
            <option value="INTRADAY_TRAILING">Intraday trailing (no lock)</option>
          </Select>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Payout rule</p>
        <p className="mb-4 text-xs text-muted-foreground">
          These thresholds vary by account type/size and change over time — confirm against
          your actual Topstep account agreement, not just these defaults.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="consistencyRulePct">Consistency rule (%)</Label>
            <Input
              id="consistencyRulePct"
              type="number"
              step="any"
              {...register("consistencyRulePct")}
            />
            <p className="text-xs text-muted-foreground">
              Max % of total profit any single day may account for.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minTradingDays">Min trading days</Label>
            <Input id="minTradingDays" type="number" {...register("minTradingDays")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minWinningDays">Min winning days</Label>
            <Input id="minWinningDays" type="number" {...register("minWinningDays")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minWinningDayAmount">Min winning day amount ($)</Label>
            <Input
              id="minWinningDayAmount"
              type="number"
              step="any"
              {...register("minWinningDayAmount")}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {saved && !isPending && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
