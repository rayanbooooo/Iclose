# MNQ Dashboard

Personal trading dashboard for MNQ (Micro E-mini Nasdaq-100 futures) built around a
15-minute swing-high/swing-low breakout-and-retest strategy, with a Topstep
funded-account payout-readiness tracker.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · hand-authored shadcn-style UI
components · Prisma + Postgres via [Neon](https://neon.tech) (the
`@prisma/adapter-neon` driver adapter) · Recharts · react-hook-form + Zod.

Local dev and the deployed app share one Neon database — this is a personal,
single-user tool, so there's no separate dev/prod split.

## Getting started

1. Get a Postgres connection string. Easiest path: add the **Neon** storage
   integration to this project on Vercel (dashboard → Storage tab, or
   `vercel install neon`), which provisions a free-tier database and can
   inject `DATABASE_URL` into the Vercel project automatically. Pull it down
   for local dev with `vercel env pull .env` (or copy it manually into a
   local `.env` file — see `.env.example`).
2. Install and set up:

```bash
npm install
npx prisma generate
npm run db:push   # creates the schema on the connected database (first time only)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First stop is **Settings** —
create your Topstep account and payout-rule thresholds there; the Dashboard,
Journal, and Stats pages all need an account to exist before they show anything
beyond a setup prompt.

Schema changes after the first `db:push`: for now, keep using `db:push` — there's
no live database yet to generate a proper versioned Postgres migration against.
Once this is running against a real database, switch to `prisma migrate dev`
locally + `prisma migrate deploy` in `vercel-build` for real migration history
(safer for data already in the table than `db push`, which can silently drop
columns).

## Deploying

The Vercel project's build command is `npm run vercel-build` (`prisma generate
&& next build` — schema push is a deliberate manual step, not part of the
automated build, so a deploy never risks the database on its own). Once Neon
storage is attached to the project and `DATABASE_URL` is set, pushes to the
production branch deploy automatically.

## Other commands

```bash
npm run lint        # ESLint
npx tsc --noEmit     # type-check
npx prisma studio    # browse the database at localhost:5555
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
