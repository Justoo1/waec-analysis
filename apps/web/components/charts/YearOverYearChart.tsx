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

export interface YearOverYearData {
  subject: string;
  [year: string]: number | string;
}

interface Props {
  data: YearOverYearData[];
  years?: string[];
}

const COLORS = ["#1A6B47", "#C07818", "#2E7D7A", "#B83232"];

export function YearOverYearChart({ data, years = [] }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6860", fontSize: 13 }}>
        No comparison data available
      </div>
    );
  }

  const height = Math.max(320, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        barCategoryGap="30%"
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E0D8" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#6B6860" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="subject"
          width={150}
          tick={{ fontSize: 11, fill: "#0D1F17" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`${v}%`]}
          contentStyle={{ borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 12 }}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {years.map((year, i) => (
          <Bar
            key={year}
            dataKey={year}
            name={`WASSCE ${year}`}
            fill={COLORS[i % COLORS.length]}
            radius={[0, 3, 3, 0]}
            maxBarSize={18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
