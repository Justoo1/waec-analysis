"use client";

import { useEffect, useState } from "react";
import type { Candidate, Grade } from "@/lib/mock-data";
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

interface ApiResult {
  id: number;
  subject: string;
  grade: string;
  isCore: boolean | null;
  isElective: boolean | null;
}

interface Props {
  candidate: Candidate;
  candidateId?: number;
  onClose: () => void;
}

export function CandidatePanel({ candidate, candidateId, onClose }: Props) {
  const cfg = STATUS_CFG[candidate.status];
  const [results, setResults] = useState<ApiResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (!candidateId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults([]);
    setLoadingResults(true);
    fetch(`/api/candidates/${candidateId}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingResults(false));
  }, [candidateId]);

  const coreResults = results.filter((r) => r.isCore);
  const electiveResults = results.filter((r) => r.isElective);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,23,0.35)" }} />
      <div
        style={{
          position: "relative", width: 480, background: "#fff", height: "100vh",
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
        <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
          {/* Status summary */}
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

          {/* Results */}
          {loadingResults ? (
            <div style={{ fontSize: 13, color: "#6B6860", padding: "12px 0" }}>Loading results…</div>
          ) : results.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9E9B94", padding: "12px 0" }}>No results on record.</div>
          ) : (
            <>
              {coreResults.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: 10 }}>
                    Core Subjects
                  </div>
                  {coreResults.map((r) => <ResultRow key={r.id} result={r} />)}
                  <div style={{ marginBottom: 20 }} />
                </>
              )}
              {electiveResults.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: 10 }}>
                    Elective Subjects
                  </div>
                  {electiveResults.map((r) => <ResultRow key={r.id} result={r} />)}
                </>
              )}
              {/* Fallback: uncategorised results */}
              {coreResults.length === 0 && electiveResults.length === 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: 10 }}>
                    Results
                  </div>
                  {results.map((r) => <ResultRow key={r.id} result={r} />)}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E0D8" }}>
          <button
            onClick={() => candidateId && window.open(`/results/${candidateId}/print`, "_blank")}
            disabled={!candidateId}
            style={{
              width: "100%", padding: 10, borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: candidateId ? "#1A6B47" : "none",
              border: candidateId ? "none" : "1px solid #E2E0D8",
              cursor: candidateId ? "pointer" : "default",
              color: candidateId ? "#fff" : "#0D1F17",
              opacity: candidateId ? 1 : 0.5,
            }}
          >
            ⊞ Print Report Card
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: ApiResult }) {
  const gc = GRADE_COLORS[result.grade as Grade] ?? { bg: "#E2E0D8", text: "#333", label: "" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #E2E0D8" }}>
      <div style={{ flex: 1, fontSize: 13, color: "#0D1F17" }}>{result.subject}</div>
      <GradeBadge grade={result.grade as Grade} />
      <div style={{ width: 80 }}>
        <div style={{ height: 5, background: "#F0EDE6", borderRadius: 3 }}>
          <div style={{ height: "100%", width: `${GRADE_WIDTHS[result.grade] ?? 0}%`, background: gc.bg, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#6B6860", width: 56, textAlign: "right" }}>{gc.label}</div>
    </div>
  );
}
