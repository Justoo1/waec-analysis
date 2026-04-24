"use client";

import { useState } from "react";
import { SUBJECTS, GRADE_COLORS, GRADE_ORDER } from "@/lib/mock-data";
import type { Subject } from "@/lib/mock-data";
import { HorizontalBar } from "@/components/charts/HorizontalBar";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { SubjectModal } from "@/components/SubjectModal";

const TH_STYLE: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left",
  fontSize: 11, fontWeight: 600, color: "#6B6860",
  textTransform: "uppercase", letterSpacing: "0.07em",
};

const TH_CENTER: React.CSSProperties = { ...TH_STYLE, textAlign: "center", padding: "10px 4px" };

export default function SubjectsPage() {
  const [sort, setSort] = useState<"passRate" | "name">("passRate");
  const [modal, setModal] = useState<Subject | null>(null);

  const sorted = [...SUBJECTS].sort((a, b) =>
    sort === "passRate" ? b.passRate - a.passRate : a.name.localeCompare(b.name)
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>Subject Analysis</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>WASSCE 2025 · All subjects</div>
        </div>
      </div>

      {/* Sort control */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "passRate" | "name")}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="passRate">Sort by Pass Rate</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Pass rate bar chart */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>Pass Rate by Subject</div>
          <div style={{ fontSize: 11, color: "#C07818" }}>│ 90% target line</div>
        </div>
        {sorted.map((s) => (
          <HorizontalBar key={s.code} label={s.name} value={s.passRate} max={100} target={90} warn />
        ))}
      </div>

      {/* Detail table */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#FAFAF8", borderBottom: "2px solid #E2E0D8" }}>
              <th style={TH_STYLE}>Subject</th>
              <th style={{ ...TH_STYLE, textAlign: "center", padding: "10px 8px" }}>Cands</th>
              {GRADE_ORDER.map((g) => (
                <th key={g} style={TH_CENTER}><GradeBadge grade={g} /></th>
              ))}
              <th style={{ ...TH_CENTER, color: "#1A6B47", textTransform: "uppercase" }}>Pass %</th>
              <th style={{ ...TH_CENTER, color: "#B83232", textTransform: "uppercase" }}>Fail %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const total = Object.values(s.grades).reduce((a, b) => a + b, 0);
              const failPct = (100 - s.passRate).toFixed(1);
              const passColor = s.passRate < 85 ? "#B83232" : s.passRate < 90 ? "#C07818" : "#1A6B47";
              return (
                <tr
                  key={s.code}
                  onClick={() => setModal(s)}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                    borderBottom: "1px solid #E2E0D8",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF6F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8")}
                >
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>{s.name}</td>
                  <td style={{ padding: "10px 8px", textAlign: "center", color: "#6B6860" }}>{s.cands}</td>
                  {GRADE_ORDER.map((g) => {
                    const cnt = s.grades[g] ?? 0;
                    const gbg = GRADE_COLORS[g]?.bg ?? "transparent";
                    return (
                      <td
                        key={g}
                        style={{
                          padding: "10px 4px",
                          textAlign: "center",
                          background: cnt > 0 ? `${gbg}22` : "transparent",
                        }}
                      >
                        {cnt > 0 ? cnt : <span style={{ color: "#E2E0D8" }}>—</span>}
                      </td>
                    );
                  })}
                  <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: passColor, fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.passRate.toFixed(1)}%
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center", color: "#B83232", fontFamily: "'JetBrains Mono', monospace" }}>
                    {failPct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E0D8", fontSize: 12, color: "#6B6860" }}>
          Click any row for detailed grade distribution
        </div>
      </div>

      {modal && <SubjectModal subject={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
