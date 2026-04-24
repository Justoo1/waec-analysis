import { STATS, PROGRAMMES, AGG_DISTRIBUTION, BORDERLINE_CANDIDATES } from "@/lib/mock-data";
import { AggBar } from "@/components/charts/AggBar";
import { GradeBadge } from "@/components/ui/GradeBadge";
import Link from "next/link";

const HERO_CARDS = [
  { label: "QUALIFY",          value: STATS.qualifiers, pct: `${STATS.qualifyPct}%`,    accent: "#1A6B47", bg: "#E6F4EC", text: "#1A6B47" },
  { label: "BORDERLINE",       value: STATS.borderline, pct: `${STATS.borderlinePct}%`, accent: "#C07818", bg: "#FEF3E2", text: "#C07818" },
  { label: "DO NOT QUALIFY",   value: STATS.noQualify,  pct: `${STATS.noQualifyPct}%`,  accent: "#B83232", bg: "#FDECEC", text: "#B83232" },
];

const TH_STYLE: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left",
  fontSize: 11, fontWeight: 600, color: "#6B6860",
  textTransform: "uppercase", letterSpacing: "0.07em",
};

export default function UniversityPage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            University Qualification
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>WASSCE 2025 · Best-six aggregate analysis</div>
        </div>
      </div>

      {/* Hero cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {HERO_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1, background: card.bg, borderRadius: 8,
              padding: 24, borderTop: `4px solid ${card.accent}`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: card.text, marginBottom: 10 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 40, fontWeight: 600, color: card.text, fontFamily: "'Lora', serif", lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 16, color: card.text, marginTop: 6, opacity: 0.8 }}>{card.pct} of cohort</div>
          </div>
        ))}
      </div>

      {/* Aggregate distribution */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 4 }}>Aggregate Distribution</div>
        <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 16 }}>Best-six aggregate scores across qualifying candidates</div>
        <AggBar data={AGG_DISTRIBUTION} />
        <div style={{ display: "flex", gap: 2, marginTop: 4, paddingLeft: 4 }}>
          {AGG_DISTRIBUTION.map((d) => (
            <div key={d.agg} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#6B6860" }}>{d.agg}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center" }}>
          {([
            ["#1A6B47", "Competitive (≤24)"],
            ["#C07818", "Good (25–30)"],
            ["#B83232", "Marginal (31+)"],
          ] as [string, string][]).map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B6860" }}>
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Programme breakdown */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>Qualification by Programme</div>
        {PROGRAMMES.map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid #E2E0D8" }}>
            <div style={{ width: 120, fontSize: 13, color: "#0D1F17", fontWeight: 500 }}>{p.name}</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "#F0EDE6", borderRadius: 4 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${p.pct}%`,
                    background: p.pct >= 80 ? "#1A6B47" : p.pct >= 70 ? "#C07818" : "#B83232",
                    borderRadius: 4,
                    transition: "width 0.5s",
                  }}
                />
              </div>
            </div>
            <div style={{ width: 80, fontSize: 12, textAlign: "right", color: "#6B6860" }}>{p.qualify} / {p.total}</div>
            <div style={{ width: 48, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: p.pct >= 80 ? "#1A6B47" : "#C07818", textAlign: "right" }}>
              {p.pct}%
            </div>
          </div>
        ))}
      </div>

      {/* Borderline intervention table */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>Candidates Needing Intervention</div>
          <span style={{ background: "#FEF3E2", color: "#C07818", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>
            {STATS.borderline} students
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 16 }}>
          Students with 5 passes — one more subject could qualify them for university
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E2E0D8" }}>
              {["Index", "Name", "Missing Subject", "Grade Needed", "Current Grade"].map((h) => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BORDERLINE_CANDIDATES.map((c, i) => (
              <tr key={c.index} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: "1px solid #E2E0D8" }}>
                <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B6860" }}>{c.index}</td>
                <td style={{ padding: "10px 12px", fontWeight: 500, color: "#0D1F17" }}>{c.name}</td>
                <td style={{ padding: "10px 12px", color: "#6B6860" }}>{c.missing}</td>
                <td style={{ padding: "10px 12px" }}><GradeBadge grade={c.needed} /></td>
                <td style={{ padding: "10px 12px" }}><GradeBadge grade={c.currentGrade} /></td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #E2E0D8" }}>
              <td colSpan={5} style={{ padding: "10px 12px", fontSize: 12, color: "#6B6860" }}>
                Showing 5 of {STATS.borderline} borderline candidates —{" "}
                <Link href="/results" style={{ color: "#1A6B47", textDecoration: "underline" }}>
                  view all in Candidates →
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
