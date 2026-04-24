"use client";

import type { Candidate } from "@/lib/mock-data";
import { GRADE_COLORS } from "@/lib/mock-data";
import { GradeBadge } from "@/components/ui/GradeBadge";

const STATUS_CFG = {
  qualify:      { bg: "#E6F4EC", text: "#1A6B47", title: "QUALIFIES FOR UNIVERSITY" },
  borderline:   { bg: "#FEF3E2", text: "#C07818", title: "BORDERLINE — 5 PASSES" },
  "no-qualify": { bg: "#FDECEC", text: "#B83232", title: "DOES NOT QUALIFY" },
} as const;

const GRADE_WIDTHS: Record<string, number> = {
  A1: 100, B2: 88, B3: 80, C4: 70, C5: 60, C6: 50, D7: 38, E8: 26, F9: 10,
};

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidatePanel({ candidate, onClose }: Props) {
  const cfg = STATUS_CFG[candidate.status];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,23,0.35)" }} />
      <div
        style={{
          position: "relative", width: 460, background: "#fff", height: "100vh",
          overflow: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          animation: "slideIn 0.25s ease-out",
          display: "flex", flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E0D8", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1F17", fontFamily: "'Lora', serif" }}>
              {candidate.name}
            </div>
            <div style={{ fontSize: 12, color: "#6B6860", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              {candidate.index} · {candidate.gender === "F" ? "Female" : "Male"} · DOB: {candidate.dob}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6B6860", padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <div style={{ background: cfg.bg, borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cfg.text, letterSpacing: "0.06em" }}>{cfg.title}</div>
            {candidate.agg !== null && (
              <div style={{ fontSize: 13, color: cfg.text, marginTop: 4 }}>
                Best Six Aggregate: <strong>{candidate.agg}</strong>
              </div>
            )}
            <div style={{ fontSize: 12, color: cfg.text, marginTop: 2, opacity: 0.8 }}>
              Total Passes: {candidate.passes}/{candidate.total}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: 12 }}>
            Results
          </div>
          {candidate.results.map((r, i) => {
            const gc = GRADE_COLORS[r.g] ?? { bg: "#E2E0D8", label: "" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #E2E0D8" }}>
                <div style={{ flex: 1, fontSize: 13, color: "#0D1F17" }}>{r.s}</div>
                <GradeBadge grade={r.g} />
                <div style={{ width: 100 }}>
                  <div style={{ height: 6, background: "#F0EDE6", borderRadius: 3 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${GRADE_WIDTHS[r.g] ?? 0}%`,
                        background: gc.bg,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#6B6860", width: 58, textAlign: "right" }}>{gc.label}</div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E0D8" }}>
          <button
            style={{
              width: "100%", padding: 10, borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: "none", border: "1px solid #E2E0D8", cursor: "pointer", color: "#0D1F17",
            }}
          >
            ⊞ Print Report Card
          </button>
        </div>
      </div>
    </div>
  );
}
