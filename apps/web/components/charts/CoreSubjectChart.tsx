"use client";

import type { Subject } from "@/lib/mock-data";
import { GradeStackBar } from "./GradeStackBar";

const CORE_CODES = ["ENG", "CMATH", "SOCSTUDY", "INTSC"];

interface Props {
  subjects: Subject[];
}

export function CoreSubjectChart({ subjects }: Props) {
  const core = subjects.filter((s) => CORE_CODES.includes(s.code));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {core.map((s) => {
        const total = Object.values(s.grades).reduce((a, b) => a + b, 0);
        return (
          <div key={s.code}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "#0D1F17", fontWeight: 500 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: "#1A6B47", fontWeight: 600 }}>{s.passRate}%</span>
            </div>
            <GradeStackBar grades={s.grades} total={total} />
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        {([
          ["A1", "Distinction", "#1A6B47"],
          ["B2–B3", "Credit", "#2D8F5E"],
          ["C4–C6", "Pass", "#2E7D7A"],
          ["D7", "Borderline", "#C07818"],
          ["E8", "Weak Fail", "#B85C1A"],
          ["F9", "Fail", "#B83232"],
        ] as [string, string, string][]).map(([g, l, c]) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B6860" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            {g} {l}
          </div>
        ))}
      </div>
    </div>
  );
}
