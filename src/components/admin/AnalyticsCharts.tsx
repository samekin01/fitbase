"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Line = { key: string; label: string; color: string };

export function TrendChart({ data, lines, height = 220 }: { data: Record<string, any>[]; lines: Line[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#E8EAED" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ fontSize: "0.8125rem", border: "1px solid var(--color-gray-200)", borderRadius: "6px" }}
          labelStyle={{ fontWeight: 700 }}
        />
        {lines.map((line) => (
          <Area
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            fill={line.color}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
