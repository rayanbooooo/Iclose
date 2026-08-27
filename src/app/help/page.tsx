import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What's real vs. sample data on this dashboard?",
    answer:
      "Your Journal, Stats, Settings, payout readiness, Pattern Intel, AI Coach, Ranks, and Tax Report all run on trades you've actually logged — fully real. The Chart page runs the strategy engine against generated sample MNQ candles (clearly labeled) since a live market-data feed hasn't been wired up yet. News and Global Intelligence mix a periodically-synced snapshot (TipRanks) with live daily FX reference rates (ECB via Frankfurter) — timestamps are shown so you know how fresh each piece is.",
  },
  {
    question: "How is P&L calculated?",
    answer:
      "(exitPrice − entryPrice) × direction × contracts × contractMultiplier − fees, where direction is +1 for long and −1 for short. The default multiplier is $2/point for MNQ.",
  },
  {
    question: "What's a 'trading day' for the consistency rule and calendars?",
    answer:
      "Trades are bucketed by the exchange-local (America/New_York) calendar date of their exit (or entry, if still open). This is a practical simplification, not CME's official trade-date roll convention.",
  },
  {
    question: "How does the strategy engine decide LONG vs. SHORT?",
    answer:
      "It marks N-bar fractal swing highs/lows on the 15m chart. A close below a swing low fires an immediate short. A close above a swing high arms a retest — once price comes back and holds above that line, it confirms a long. Mirrored behavior (applying both rules to the opposite side of each line) exists but is off by default until it's confirmed against your own strategy notes.",
  },
  {
    question: "How do I reset my data?",
    answer:
      "Settings → Danger zone → Reset trades permanently deletes all logged trades for the active account. Your account and payout-rule configuration are left untouched.",
  },
  {
    question: "Why is 'The Clan' empty?",
    answer:
      "This is a single-user tool — there's no one else to chat with, so a literal community feature would just be a fake, empty room. That page is an honest placeholder rather than something dressed up to look functional.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Get Help" description="How this dashboard actually works" />
      <PageTransition>
        <div className="max-w-2xl space-y-4 p-6 md:p-8">
          {FAQS.map((faq) => (
            <Card key={faq.question}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageTransition>
    </>
  );
}
