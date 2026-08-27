"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

export function EquitySparkline({ data }: { data: { balance: number }[] }) {
  const balances = data.map((d) => d.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const padding = Math.max((max - min) * 0.15, 10);
  const trendingUp = balances.length > 1 && balances[balances.length - 1] >= balances[0];

  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <YAxis domain={[min - padding, max + padding]} hide />
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={trendingUp ? "var(--color-success)" : "var(--color-destructive)"}
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor={trendingUp ? "var(--color-success)" : "var(--color-destructive)"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="balance"
          stroke={trendingUp ? "var(--color-success)" : "var(--color-destructive)"}
          strokeWidth={1.75}
          fill="url(#sparklineFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
