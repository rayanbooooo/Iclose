"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { formatCurrency } from "@/lib/format";

export function PnlByDayChart({ data }: { data: { day: string; pnl: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), "P&L"]}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.day}
              fill={d.pnl >= 0 ? "var(--color-success)" : "var(--color-destructive)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
