"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { formatMoney } from "@/lib/format";

export function EquityChart({ data }: { data: { date: string; balance: number }[] }) {
  const balances = data.map((d) => d.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const padding = Math.max((max - min) * 0.15, 25);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[min - padding, max + padding]}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => (v ? new Date(v as string).toLocaleString() : "")}
          formatter={(value) => [formatMoney(Number(value ?? 0)), "Balance"]}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
