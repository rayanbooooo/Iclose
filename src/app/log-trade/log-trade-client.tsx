"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeForm } from "@/app/journal/trade-form";

export function LogTradeClient({ accountId }: { accountId: string }) {
  const [formKey, setFormKey] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Quick trade entry</CardTitle>
        <CardDescription>
          Saves straight to your Journal.{savedCount > 0 ? ` ${savedCount} logged this session.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TradeForm
          key={formKey}
          accountId={accountId}
          onSaved={() => {
            setSavedCount((n) => n + 1);
            setFormKey((k) => k + 1);
          }}
        />
      </CardContent>
    </Card>
  );
}
