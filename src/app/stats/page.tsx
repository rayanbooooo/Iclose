import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Stats" description="Win rate, equity curve, P&L by day, streaks" />
      <div className="p-6 md:p-8">
        <EmptyState
          icon={BarChart3}
          title="No stats yet"
          description="Analytics computed from your journal data will show up here once you've logged trades."
          phase="Phase 2: stats/analytics."
        />
      </div>
    </>
  );
}
