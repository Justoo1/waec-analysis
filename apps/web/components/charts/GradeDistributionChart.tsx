"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const GRADE_COLORS: Record<string, string> = {
  A1: "#22c55e",
  B2: "#86efac",
  B3: "#bbf7d0",
  C4: "#fde68a",
  C5: "#fcd34d",
  C6: "#fbbf24",
  D7: "#fb923c",
  E8: "#f87171",
  F9: "#ef4444",
};

export interface GradeDistributionChartData {
  subject: string;
  A1: number;
  B2: number;
  B3: number;
  C4: number;
  C5: number;
  C6: number;
  D7: number;
  E8: number;
  F9: number;
}

interface Props {
  data: GradeDistributionChartData[];
}

export function GradeDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No data — upload results to see grade distribution
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {(["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"] as const).map(
          (grade) => (
            <Bar
              key={grade}
              dataKey={grade}
              stackId="grades"
              fill={GRADE_COLORS[grade]}
            />
          )
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
