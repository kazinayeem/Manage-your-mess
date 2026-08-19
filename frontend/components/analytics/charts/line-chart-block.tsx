"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type LineDef = { key: string; color: string; name: string };

export default function LineChartBlock({
  data,
  xKey,
  lines,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  lines: LineDef[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#71717a" />
        <YAxis tick={{ fontSize: 11 }} stroke="#71717a" />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Legend />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            name={l.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
