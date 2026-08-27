import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveAccountWithRule } from "@/lib/account";
import { AccountForm } from "./account-form";

export default async function SettingsPage() {
  const account = await getActiveAccountWithRule();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, payout rules, and strategy configuration"
      />
      <div className="p-6 md:p-8">
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
      </div>
    </>
  );
}
