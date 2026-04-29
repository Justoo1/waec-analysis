import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant";
import type { Grade } from "@/lib/mock-data";
import { GRADE_COLORS } from "@/lib/mock-data";
import { PrintTrigger } from "./PrintTrigger";

const GRADE_LABELS: Record<string, string> = {
  A1: "Distinction", B2: "Credit", B3: "Credit",
  C4: "Credit", C5: "Pass", C6: "Pass",
  D7: "Borderline", E8: "Weak Fail", F9: "Fail",
};

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.schoolNumber) redirect("/login");

  const { id } = await params;
  const candidateId = parseInt(id);
  if (isNaN(candidateId)) redirect("/results");

  const { db: tdb, schema: s, close } = await getTenantDb(session.user.schoolNumber);

  let candidate: typeof s.candidates.$inferSelect | null = null;
  let results: (typeof s.results.$inferSelect)[] = [];
  let flags: typeof s.qualificationFlags.$inferSelect | null = null;

  try {
    const rows = await tdb.select().from(s.candidates).where(eq(s.candidates.id, candidateId)).limit(1);
    candidate = rows[0] ?? null;
    if (!candidate) redirect("/results");

    const [res, fl] = await Promise.all([
      tdb.select().from(s.results).where(eq(s.results.candidateId, candidateId)),
      tdb.select().from(s.qualificationFlags).where(eq(s.qualificationFlags.candidateId, candidateId)).limit(1),
    ]);
    results = res;
    flags = fl[0] ?? null;
  } catch {
    // schema not provisioned
  } finally {
    await close();
  }

  const coreResults = results.filter((r) => r.isCore);
  const electiveResults = results.filter((r) => r.isElective);

  const qualStatus = flags?.qualifiesUniversity
    ? { label: "Qualifies for University", color: "#1A6B47", bg: "#E6F4EC" }
    : flags && (flags.totalPasses ?? 0) >= 5
    ? { label: "Borderline — 5 Passes", color: "#C07818", bg: "#FEF3E2" }
    : { label: "Does Not Qualify", color: "#B83232", bg: "#FDECEC" };

  const pathways = [
    ["Science",  flags?.qualifiesScience],
    ["Business", flags?.qualifiesBusiness],
    ["Arts",     flags?.qualifiesArts],
    ["General",  flags?.qualifiesGeneral],
  ] as [string, boolean | null][];

  return (
    <>
      <PrintTrigger />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 40px", fontFamily: "system-ui, sans-serif" }}>
        {/* School header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "2px solid #0D1F17" }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6860", marginBottom: 4 }}>
              WASSCE Results Report Card
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#0D1F17", fontFamily: "'Lora', serif" }}>
              {session.user.schoolName ?? "—"}
            </div>
            <div style={{ fontSize: 12, color: "#6B6860", marginTop: 2 }}>
              School Code: {session.user.schoolNumber}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#6B6860", textAlign: "right" }}>
            Printed: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Candidate info */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D1F17", margin: "0 0 6px", fontFamily: "'Lora', serif" }}>
            {candidate!.fullName}
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860" }}>
            {candidate!.indexNumber} · {candidate!.programme} · {candidate!.gender === "F" ? "Female" : "Male"}
            {candidate!.dateOfBirth ? ` · DOB: ${candidate!.dateOfBirth}` : ""}
          </div>
        </div>

        {/* Qualification status */}
        {flags && (
          <div style={{ background: qualStatus.bg, border: `1px solid ${qualStatus.color}40`, borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: qualStatus.color, marginBottom: 6 }}>
              {qualStatus.label}
            </div>
            <div style={{ display: "flex", gap: 28, fontSize: 13 }}>
              <span style={{ color: "#0D1F17" }}>Total passes: <strong>{flags.totalPasses}</strong></span>
              <span style={{ color: "#0D1F17" }}>Core passes: <strong>{flags.corePasses}</strong></span>
              <span style={{ color: "#0D1F17" }}>Elective passes: <strong>{flags.electivePasses}</strong></span>
              {flags.bestSixAggregate != null && (
                <span style={{ color: "#0D1F17" }}>Best-six aggregate: <strong>{flags.bestSixAggregate}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Results tables */}
        <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
          {[
            { title: "Core Subjects",     rows: coreResults },
            { title: "Elective Subjects", rows: electiveResults },
          ].map(({ title, rows }) => (
            <div key={title} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 8 }}>
                {title}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 11, color: "#6B6860", fontWeight: 600, borderBottom: "1px solid #E2E0D8" }}>Subject</th>
                    <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, color: "#6B6860", fontWeight: 600, borderBottom: "1px solid #E2E0D8" }}>Grade</th>
                    <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 11, color: "#6B6860", fontWeight: 600, borderBottom: "1px solid #E2E0D8" }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const gc = GRADE_COLORS[r.grade as Grade] ?? { bg: "#E2E0D8", text: "#333", label: "" };
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #E2E0D8" }}>
                        <td style={{ padding: "8px 10px", color: "#0D1F17" }}>{r.subject}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 4,
                            background: gc.bg, color: gc.text, fontWeight: 700, fontSize: 12,
                          }}>
                            {r.grade}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 12, color: "#6B6860" }}>
                          {GRADE_LABELS[r.grade] ?? ""}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: "12px 10px", color: "#9E9B94", fontSize: 13 }}>—</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* University pathways */}
        {flags && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 10 }}>
              University Pathways
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {pathways.map(([label, eligible]) => (
                <div key={label} style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: eligible ? "#E6F4EC" : "#F5F5F3",
                  color: eligible ? "#1A6B47" : "#9E9B94",
                  border: `1px solid ${eligible ? "#1A6B47" : "#E2E0D8"}`,
                }}>
                  {eligible ? "✓" : "✕"} {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #E2E0D8", paddingTop: 16, fontSize: 11, color: "#9E9B94", display: "flex", justifyContent: "space-between" }}>
          <span>Generated by WASSCE Analytics</span>
          <span>{candidate!.indexNumber}</span>
        </div>
      </div>

      {/* Print button — hidden during actual printing via CSS */}
      <style>{`
        @media print { .print-btn { display: none !important; } }
      `}</style>
      <div
        className="print-btn"
        style={{
          position: "fixed", bottom: 24, right: 24,
          display: "flex", gap: 10,
        }}
      >
        <a
          href={`/results/${candidateId}`}
          style={{
            padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: "#fff", border: "1px solid #E2E0D8", color: "#0D1F17",
            textDecoration: "none",
          }}
        >
          ← Back
        </a>
      </div>
    </>
  );
}
