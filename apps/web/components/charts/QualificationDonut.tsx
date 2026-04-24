"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  qualifies: number;
  doesNotQualify: number;
}

export function QualificationDonut({ qualifies, doesNotQualify }: Props) {
  const total = qualifies + doesNotQualify;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No data — upload results to see qualification breakdown
      </div>
    );
  }

  const data = [
    { name: "Qualifies", value: qualifies },
    { name: "Does not qualify", value: doesNotQualify },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          <Cell fill="#22c55e" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip formatter={(v, name) => [`${v} candidates`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
