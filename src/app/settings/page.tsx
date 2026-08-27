import { Settings } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, payout rules, and strategy configuration"
      />
      <div className="p-6 md:p-8">
        <EmptyState
          icon={Settings}
          title="Nothing configured yet"
          description="Your Topstep account details, payout-rule thresholds, and strategy parameters will be editable here."
          phase="Phase 2: account + payout-rule settings."
        />
      </div>
    </>
  );
}
