import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { NotesList } from "./notes-list";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const account = await getActiveAccountWithRule();

  if (!account) {
    return (
      <>
        <PageHeader title="Notes" description="Personal trading notes" />
        <PageTransition>
          <div className="p-6 md:p-8">
            <Card className="max-w-md border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Set up your account in{" "}
                <Link href="/settings" className="text-primary underline">
                  Settings
                </Link>{" "}
                first.
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </>
    );
  }

  const notes = await db.note.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Notes" description="Personal trading notes" />
      <PageTransition>
        <div className="p-6 md:p-8">
          <NotesList accountId={account.id} notes={notes} />
        </div>
      </PageTransition>
    </>
  );
}
