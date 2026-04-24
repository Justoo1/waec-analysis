import { STATS, SUBJECTS } from "@/lib/mock-data";
import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { CoreSubjectChart } from "@/components/charts/CoreSubjectChart";
import Link from "next/link";

const DONUT_SEGMENTS = [
  { value: STATS.qualifyPct,    color: "#1A6B47", label: `${STATS.qualifyPct}%`, sub: "Qualifying" },
  { value: STATS.borderlinePct, color: "#C07818" },
  { value: STATS.noQualifyPct,  color: "#B83232" },
];

const LEGEND = [
  { label: "Qualifies",         value: STATS.qualifiers, pct: STATS.qualifyPct,    color: "#1A6B47" },
  { label: "Borderline",        value: STATS.borderline, pct: STATS.borderlinePct, color: "#C07818" },
  { label: "Does not qualify",  value: STATS.noQualify,  pct: STATS.noQualifyPct,  color: "#B83232" },
];

export default function DashboardPage() {
  const topSubjects    = [...SUBJECTS].sort((a, b) => b.passRate - a.passRate).slice(0, 5);
  const bottomSubjects = [...SUBJECTS].sort((a, b) => a.passRate - b.passRate).slice(0, 5);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 24, paddingBottom: 20,
          borderBottom: "1px solid #E2E0D8",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            WASSCE 2025 — Overview
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            Archbishop Porter Girls&apos; SHS · Code: 0040103 · Takoradi, Western Region
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#6B6860" }}>Last updated: {STATS.lastUpdated}</span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Candidates"
          value={STATS.totalCandidates}
          sub="↑ 19 more than last year"
          subColor="#1A6B47"
        />
        <StatCard
          label="University Qualifiers"
          value={STATS.qualifiers}
          sub={`${STATS.qualifyPct}% of cohort`}
          subColor="#1A6B47"
        />
        <StatCard
          label="Overall Pass Rate"
          value={`${STATS.overallPassRate}%`}
          sub="Across all subjects"
        />
        <StatCard
          label="Best Subject"
          value={STATS.bestSubject}
          sub="100% pass rate"
          accent="#2E7D7A"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {/* Donut */}
        <div style={{ flex: "0 0 340px", background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>Qualification Overview</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart segments={DONUT_SEGMENTS} size={160} thickness={32} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LEGEND.map((seg) => (
                <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: "#6B6860" }}>{seg.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0D1F17" }}>
                      {seg.value}{" "}
                      <span style={{ fontSize: 11, color: "#6B6860", fontWeight: 400 }}>({seg.pct}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core subject grade distribution */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>
            Core Subject Grade Distribution
          </div>
          <CoreSubjectChart subjects={SUBJECTS} />
        </div>
      </div>

      {/* Subject performance summary */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>
          Subject Performance Summary
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { title: "↑ Top performing",   items: topSubjects,    color: "#1A6B47" },
            { title: "↓ Needs attention",   items: bottomSubjects, color: "#B83232" },
          ].map((col) => (
            <div key={col.title} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 10 }}>
                {col.title}
              </div>
              {col.items.map((s, i) => (
                <div
                  key={s.code}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 5,
                    background: i % 2 === 0 ? "#FAFAF8" : "#fff",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#0D1F17" }}>{s.name}</span>
                  <span style={{ fontWeight: 600, color: col.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {s.passRate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Link
            href="/subjects"
            style={{ fontSize: 12, color: "#1A6B47", textDecoration: "underline" }}
          >
            View full subject analysis →
          </Link>
        </div>
      </div>
    </div>
  );
}
