"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface YearOverYearData {
  subject: string;
  [year: string]: number | string;
}

interface Props {
  data: YearOverYearData[];
  years?: string[];
}

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

export function YearOverYearChart({ data, years = [] }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No comparison data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend />
        {years.map((year, i) => (
          <Line
            key={year}
            type="monotone"
            dataKey={year}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
