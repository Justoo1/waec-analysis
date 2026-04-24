"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Subject } from "@/lib/mock-data";
import { GRADE_COLORS, GRADE_ORDER } from "@/lib/mock-data";
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
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");

  const [sort, setSort] = useState<"passRate" | "name">("passRate");
  const [modal, setModal] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  function handleExportCsv() {
    const header = ["Subject", "Candidates", "A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9", "Pass %", "Fail %"];
    const lines = [
      header.join(","),
      ...subjects.map((s) => [
        `"${s.name.replace(/"/g, '""')}"`,
        s.cands,
        s.grades.A1, s.grades.B2, s.grades.B3, s.grades.C4, s.grades.C5, s.grades.C6,
        s.grades.D7, s.grades.E8, s.grades.F9,
        s.passRate.toFixed(1),
        (100 - s.passRate).toFixed(1),
      ].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subjects.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (yearParam) params.set("year", yearParam);
    fetch(`/api/subjects?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const mapped: Subject[] = (data.subjects ?? []).map(
          (s: { name: string; cands: number; passRate: number; grades: Subject["grades"] }) => ({
            name: s.name,
            code: s.name,
            cands: s.cands,
            passRate: s.passRate,
            grades: s.grades,
          })
        );
        setSubjects(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [yearParam]);

  const sorted = [...subjects].sort((a, b) =>
    sort === "passRate" ? b.passRate - a.passRate : a.name.localeCompare(b.name)
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>Subject Analysis</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>All subjects · pass rates and grade distributions</div>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={subjects.length === 0}
          className="no-print"
          style={{
            padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: "#fff", border: "1px solid #E2E0D8", cursor: "pointer",
            color: "#0D1F17", display: "flex", alignItems: "center", gap: 6,
            opacity: subjects.length === 0 ? 0.5 : 1,
          }}
        >
          ↓ Export CSV
        </button>
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

      {loading ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center", color: "#6B6860", fontSize: 13, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          Loading subjects…
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          No subject data yet. Upload results to begin.
        </div>
      ) : (
        <>
          {/* Pass rate bar chart */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>Pass Rate by Subject</div>
              <div style={{ fontSize: 11, color: "#C07818" }}>│ 90% target line</div>
            </div>
            {sorted.map((s) => (
              <HorizontalBar key={s.name} label={s.name} value={s.passRate} max={100} target={90} warn />
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
                  const failPct = (100 - s.passRate).toFixed(1);
                  const passColor = s.passRate < 85 ? "#B83232" : s.passRate < 90 ? "#C07818" : "#1A6B47";
                  return (
                    <tr
                      key={s.name}
                      onClick={() => setModal(s)}
                      style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: "1px solid #E2E0D8", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF6F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8")}
                    >
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>{s.name}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#6B6860" }}>{s.cands}</td>
                      {GRADE_ORDER.map((g) => {
                        const cnt = s.grades[g] ?? 0;
                        const gbg = GRADE_COLORS[g]?.bg ?? "transparent";
                        return (
                          <td key={g} style={{ padding: "10px 4px", textAlign: "center", background: cnt > 0 ? `${gbg}22` : "transparent" }}>
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
        </>
      )}

      {modal && <SubjectModal subject={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
