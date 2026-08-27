import { NotebookText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function JournalPage() {
  return (
    <>
      <PageHeader title="Journal" description="Logged trades and P&L" />
      <div className="p-6 md:p-8">
        <EmptyState
          icon={NotebookText}
          title="No trades logged"
          description="Log entries, exits, and notes here, optionally linked to the strategy signal that triggered each trade."
          phase="Phase 2: trade journal + local persistence."
        />
      </div>
    </>
  );
}
