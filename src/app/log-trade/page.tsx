import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveAccountWithRule } from "@/lib/account";
import { LogTradeClient } from "./log-trade-client";

export const dynamic = "force-dynamic";

export default async function LogTradePage() {
  const account = await getActiveAccountWithRule();

  return (
    <>
      <PageHeader title="Log Trade" description="Fast single-trade entry" />
      <PageTransition>
        <div className="p-6 md:p-8">
          {!account ? (
            <Card className="max-w-md border-dashed">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Set up your account in{" "}
                <Link href="/settings" className="text-primary underline">
                  Settings
                </Link>{" "}
                first.
              </CardContent>
            </Card>
          ) : (
            <LogTradeClient accountId={account.id} />
          )}
        </div>
      </PageTransition>
    </>
  );
}
