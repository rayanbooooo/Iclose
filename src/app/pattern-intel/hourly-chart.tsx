"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/format";
import type { HourStat } from "@/lib/analytics/patterns";

export function HourlyChart({ data }: { data: HourStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="hour"
          tickFormatter={(h) => `${h}:00`}
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
          labelFormatter={(h) => `${h}:00 ET`}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), "Net P&L"]}
        />
        <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.hour} fill={d.netPnl >= 0 ? "var(--color-success)" : "var(--color-destructive)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
