import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getActiveAccountWithRule } from "@/lib/account";
import { NoteDialog } from "./note-dialog";
import { DeleteNoteButton } from "./delete-note-button";

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
        <div className="space-y-4 p-6 md:p-8">
          <div className="flex justify-end">
            <NoteDialog accountId={account.id} />
          </div>

          {notes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 pt-6 pb-8 text-center text-sm text-muted-foreground">
                <ClipboardList className="size-6" />
                No notes yet. Add one above.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="space-y-2 pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{note.title}</p>
                        {note.tradingDay && (
                          <p className="text-xs text-muted-foreground">{note.tradingDay}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <NoteDialog
                          accountId={account.id}
                          noteId={note.id}
                          defaultValues={{
                            title: note.title,
                            body: note.body,
                            tradingDay: note.tradingDay ?? "",
                          }}
                        />
                        <DeleteNoteButton noteId={note.id} />
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </>
  );
}
