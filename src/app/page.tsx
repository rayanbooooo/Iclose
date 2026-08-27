import { CandlestickChart, NotebookText, ShieldCheck, BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="MNQ 15m swing-high/low strategy · Topstep payout tracker"
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 md:p-8">
        <EmptyState
          icon={CandlestickChart}
          title="Chart"
          description="Live MNQ 15m candles with swing-hi/lo lines and signal markers."
          phase="Wired up in Phase 1."
        />
        <EmptyState
          icon={ShieldCheck}
          title="Payout readiness"
          description="Balance, trailing drawdown, profit target, and consistency-rule status."
          phase="Wired up in Phase 2."
        />
        <EmptyState
          icon={NotebookText}
          title="Recent trades"
          description="Your most recently logged trades, linked to the signals that triggered them."
          phase="Wired up in Phase 2."
        />
        <EmptyState
          icon={BarChart3}
          title="Performance"
          description="Win rate, equity curve, and streaks at a glance."
          phase="Wired up in Phase 2."
        />
      </div>
    </>
  );
}
