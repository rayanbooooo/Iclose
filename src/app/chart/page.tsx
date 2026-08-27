import { CandlestickChart } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";

export default function ChartPage() {
  return (
    <>
      <PageHeader
        title="Chart"
        description="MNQ · 15m · swing-high/low breakout + retest strategy"
      />
      <PageTransition>
        <div className="p-6 md:p-8">
          <EmptyState
            icon={<CandlestickChart className="size-4.5" />}
            title="No chart yet"
            description="This will render MNQ 15m candlesticks with the current swing-high/low lines and long/short signal markers, backed by the strategy engine."
            phase="Phase 1: strategy engine + chart against sample data."
          />
        </div>
      </PageTransition>
    </>
  );
}
