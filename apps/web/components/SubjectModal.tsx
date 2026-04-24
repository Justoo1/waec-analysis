"use client";

import type { Subject } from "@/lib/mock-data";
import { GRADE_COLORS, GRADE_ORDER } from "@/lib/mock-data";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { GradeStackBar } from "@/components/charts/GradeStackBar";

interface Props {
  subject: Subject;
  onClose: () => void;
}

export function SubjectModal({ subject, onClose }: Props) {
  const total = Object.values(subject.grades).reduce((a, b) => a + b, 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,23,0.4)" }} />
      <div
        style={{
          position: "relative", background: "#fff", borderRadius: 12,
          padding: "28px 32px", width: 500,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 500, color: "#0D1F17" }}>
              {subject.name}
            </div>
            <div style={{ fontSize: 12, color: "#6B6860", marginTop: 3 }}>
              {subject.cands} candidates · {subject.passRate}% pass rate
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6B6860" }}
          >
            ✕
          </button>
        </div>

        {/* Grade bars */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {GRADE_ORDER.map((g) => {
            const cnt = subject.grades[g] ?? 0;
            const pct = (cnt / total) * 100;
            return (
              <div key={g} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
                  <div
                    style={{
                      width: "70%",
                      background: GRADE_COLORS[g]?.bg ?? "#ccc",
                      borderRadius: "3px 3px 0 0",
                      height: `${Math.max(pct * 1.8, 2)}%`,
                      minHeight: cnt > 0 ? 4 : 0,
                    }}
                    title={`${cnt} candidates`}
                  />
                </div>
                <GradeBadge grade={g} />
                <div style={{ fontSize: 11, color: "#6B6860", marginTop: 3 }}>{cnt}</div>
              </div>
            );
          })}
        </div>
        <GradeStackBar grades={subject.grades} total={total} />
      </div>
    </div>
  );
}
