"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function BarChartBlock({
  data,
  xKey,
  yKey,
  layout = "horizontal",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  layout?: "horizontal" | "vertical";
}) {
  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey={xKey} type="category" width={90} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Bar dataKey={yKey} fill="#18181b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey={yKey} fill="#18181b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
