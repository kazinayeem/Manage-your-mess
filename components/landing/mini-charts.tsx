"use client";

import { useLocale } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  depositTrend,
  dueTrend,
  expenseTrend,
  getChartMonths,
  mealTrend,
  memberGrowth,
} from "@/lib/landing/chart-data";

const emerald = "#059669";

export function MiniExpenseChart() {
  const months = getChartMonths(useLocale());
  const data = expenseTrend.map((d) => ({ name: months[d.month], value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={emerald} stopOpacity={0.3} />
            <stop offset="100%" stopColor={emerald} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke={emerald} fill="url(#expG)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniMealChart() {
  const months = getChartMonths(useLocale());
  const data = mealTrend.map((d) => ({
    name: months[d.month],
    lunch: d.lunch,
    dinner: d.dinner,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="lunch" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="dinner" stroke={emerald} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniDepositChart() {
  const months = getChartMonths(useLocale());
  const data = depositTrend.map((d) => ({ name: months[d.month], value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill={emerald} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniDueChart() {
  const months = getChartMonths(useLocale());
  const data = dueTrend.map((d) => ({ name: months[d.month], value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniMemberChart() {
  const months = getChartMonths(useLocale());
  const data = memberGrowth.map((d) => ({ name: months[d.month], value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
