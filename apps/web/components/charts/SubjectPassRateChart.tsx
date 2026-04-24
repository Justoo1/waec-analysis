"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface SubjectPassRateData {
  subject: string;
  passRate: number;
}

interface Props {
  data: SubjectPassRateData[];
  /** Show only top N or bottom N subjects */
  limit?: number;
  variant?: "top" | "bottom";
}

export function SubjectPassRateChart({
  data,
  limit = 10,
  variant = "top",
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No data — upload results to see pass rates
      </div>
    );
  }

  const sorted = [...data].sort((a, b) =>
    variant === "top" ? b.passRate - a.passRate : a.passRate - b.passRate
  );
  const sliced = sorted.slice(0, limit);

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, sliced.length * 36)}>
      <BarChart
        data={sliced}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="subject"
          width={140}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="passRate" radius={[0, 4, 4, 0]}>
          {sliced.map((entry) => (
            <Cell
              key={entry.subject}
              fill={entry.passRate >= 50 ? "#22c55e" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
