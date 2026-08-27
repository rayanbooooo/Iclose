"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";

const MNQ_MULTIPLIER = 2; // $ per point, 1 MNQ contract
const MNQ_TICK = 0.25; // points per tick

export default function RiskCalculatorPage() {
  const [balance, setBalance] = useState(50000);
  const [riskPct, setRiskPct] = useState(1);
  const [stopPoints, setStopPoints] = useState(20);

  const result = useMemo(() => {
    const maxRiskDollars = balance * (riskPct / 100);
    const riskPerContract = stopPoints * MNQ_MULTIPLIER;
    const contracts = riskPerContract > 0 ? Math.floor(maxRiskDollars / riskPerContract) : 0;
    const actualRisk = contracts * riskPerContract;
    const stopTicks = stopPoints / MNQ_TICK;
    return { maxRiskDollars, riskPerContract, contracts, actualRisk, stopTicks };
  }, [balance, riskPct, stopPoints]);

  return (
    <>
      <PageHeader title="Risk Calculator" description="MNQ position sizing from your account risk %" />
      <PageTransition>
        <div className="grid gap-4 p-6 md:p-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="size-4" /> Inputs
              </CardTitle>
              <CardDescription>MNQ = $2/point, $0.50/tick (0.25 pt)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Account balance ($)</Label>
                <Input
                  id="balance"
                  type="number"
                  min={0}
                  step="any"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="riskPct">Risk per trade (%)</Label>
                <Input
                  id="riskPct"
                  type="number"
                  min={0}
                  step="any"
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stopPoints">Stop-loss distance (points)</Label>
                <Input
                  id="stopPoints"
                  type="number"
                  min={0}
                  step="any"
                  value={stopPoints}
                  onChange={(e) => setStopPoints(Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Suggested position size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground">Suggested contracts</p>
                <p className="text-4xl font-semibold tabular-nums text-primary">{result.contracts}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max risk budget</span>
                  <span className="tabular-nums font-medium">{formatMoney(result.maxRiskDollars)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk per contract</span>
                  <span className="tabular-nums font-medium">{formatMoney(result.riskPerContract)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Actual risk at this size</span>
                  <span className="tabular-nums font-medium">{formatMoney(result.actualRisk)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stop distance</span>
                  <span className="tabular-nums font-medium">{result.stopTicks.toFixed(0)} ticks</span>
                </div>
              </div>
              {result.contracts === 0 && stopPoints > 0 && (
                <p className="text-xs text-destructive">
                  Your risk budget doesn&rsquo;t cover even 1 contract at this stop distance — tighten
                  the stop or increase risk %.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
