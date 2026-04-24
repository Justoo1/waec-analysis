"use client";

import { useEffect, useState } from "react";
import type { GradeCounts } from "@/lib/mock-data";

const GRADE_BG: Record<string, string> = {
  A1: "#1A6B47", B2: "#2D8F5E", B3: "#2D8F5E",
  C4: "#2E7D7A", C5: "#2E7D7A", C6: "#2E7D7A",
  D7: "#C07818", E8: "#B85C1A", F9: "#B83232",
};
const GRADE_LIST = ["A1","B2","B3","C4","C5","C6","D7","E8","F9"];

interface Props {
  grades: GradeCounts;
  total: number;
}

export function GradeStackBar({ grades, total }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", width: "100%" }}>
      {GRADE_LIST.map((g) => {
        const cnt = grades[g as keyof GradeCounts] ?? 0;
        const pct = animated ? (cnt / total) * 100 : 0;
        return pct > 0 ? (
          <div
            key={g}
            title={`${g}: ${cnt}`}
            style={{
              width: `${pct}%`,
              background: GRADE_BG[g],
              transition: "width 0.4s ease-out",
              flexShrink: 0,
            }}
          />
        ) : null;
      })}
    </div>
  );
}
