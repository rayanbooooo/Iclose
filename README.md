# MNQ Dashboard

Personal trading dashboard for MNQ (Micro E-mini Nasdaq-100 futures) built around a
15-minute swing-high/swing-low breakout-and-retest strategy, with a Topstep
funded-account payout-readiness tracker.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · hand-authored shadcn-style UI
components · Prisma + SQLite (via the `@prisma/adapter-better-sqlite3` driver
adapter) · Recharts · react-hook-form + Zod.

## Getting started

```bash
npm install
npx prisma migrate deploy   # creates dev.db and applies the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First stop is **Settings** —
create your Topstep account and payout-rule thresholds there; the Dashboard,
Journal, and Stats pages all need an account to exist before they show anything
beyond a setup prompt.

`dev.db` is gitignored (local-only, single-user) — if it's ever missing or you
pull a fresh checkout, re-run `npx prisma migrate deploy` before `npm run dev`.

## Other commands

```bash
npm run lint        # ESLint
npx tsc --noEmit     # type-check
npx prisma studio    # browse the local database at localhost:5555
```

## Structure

- `src/lib/pnl.ts`, `src/lib/payout/`, `src/lib/analytics/` — pure, testable
  business logic (P&L, drawdown/consistency-rule/payout calculations, win
  rate/equity curve/streaks).
- `src/lib/trading-day.ts` — buckets trades into exchange-local (ET) trading
  days for daily P&L and payout-rule grouping.
- `prisma/schema.prisma` — data model (candles/signals for the strategy engine,
  accounts, payout rules, trades).
- `data/market/` — periodically-synced TipRanks market data (economic
  calendar, news, sentiment), committed as JSON since the dev sandbox this was
  built in is ephemeral. See `src/lib/market-data/`.
- `src/app/*/page.tsx` — Dashboard, Chart, Journal, News, Stats, Settings.

Chart + strategy engine (swing-hi/lo detection, breakout/retest signals) are not
built yet — that's next.
