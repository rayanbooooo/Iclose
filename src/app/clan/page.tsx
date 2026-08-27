import { MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/empty-state";

export default function ClanPage() {
  return (
    <>
      <PageHeader title="The Clan" description="A trading community — not built yet" />
      <PageTransition>
        <div className="p-6 md:p-8">
          <EmptyState
            icon={<MessageCircle className="size-4.5" />}
            title="Coming soon"
            description="A real community feature needs other real traders in it — this single-user dashboard doesn't have any yet, so this page is left as an honest placeholder rather than a fake, empty chat room."
            phase="Not scheduled — flag it if this is something you actually want built out."
          />
        </div>
      </PageTransition>
    </>
  );
}
