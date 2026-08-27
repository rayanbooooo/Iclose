import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveAccountWithRule } from "@/lib/account";
import { db } from "@/lib/db";
import { computeCurrentBalance } from "@/lib/payout";
import { formatMoney } from "@/lib/format";
import { PageTransition } from "@/components/page-transition";
import { AccountForm } from "./account-form";
import { ResetTradesButton } from "./reset-trades-button";

// Reads live account data — must render per-request, not be baked in as a
// static page at build time.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const account = await getActiveAccountWithRule();
  const trades = account ? await db.trade.findMany({ where: { accountId: account.id } }) : [];
  const tradeCount = trades.length;
  const currentBalance = account ? computeCurrentBalance(account, trades) : 0;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, payout rules, and strategy configuration"
      />
      <PageTransition>
      <div className="space-y-4 p-6 md:p-8">
        {account && (
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current balance</CardDescription>
                <CardTitle className="text-base">{formatMoney(currentBalance)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trades logged</CardDescription>
                <CardTitle className="text-base">{tradeCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Account created</CardDescription>
                <CardTitle className="text-base">
                  {account.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{account ? "Account & payout rule" : "Set up your account"}</CardTitle>
            <CardDescription>
              {account
                ? "Edit your Topstep account and payout-rule thresholds."
                : "Create your Topstep account to start tracking payout readiness."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm
              defaultValues={
                account
                  ? {
                      name: account.name,
                      accountType: account.accountType as "COMBINE" | "EXPRESS_FUNDED",
                      startingBalance: account.startingBalance,
                      profitTarget: account.profitTarget,
                      trailingDrawdown: account.trailingDrawdown,
                      drawdownMode: account.drawdownMode as
                        | "EOD_TRAILING_LOCK_AT_START"
                        | "INTRADAY_TRAILING",
                      consistencyRulePct: account.payoutRule?.consistencyRulePct,
                      minWinningDays: account.payoutRule?.minWinningDays,
                      minWinningDayAmount: account.payoutRule?.minWinningDayAmount,
                      minTradingDays: account.payoutRule?.minTradingDays,
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>

        {account && (
          <Card className="mt-4 max-w-2xl border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently deletes your logged trades. Account and payout-rule settings
                are not affected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetTradesButton accountId={account.id} tradeCount={tradeCount} />
            </CardContent>
          </Card>
        )}
      </div>
      </PageTransition>
    </>
  );
}
