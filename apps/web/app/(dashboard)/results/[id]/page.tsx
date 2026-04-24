import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant";
import { GradeBadge } from "@/components/ui/GradeBadge";
import type { Grade } from "@/lib/mock-data";
import Link from "next/link";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.schoolNumber) redirect("/login");

  const { id } = await params;
  const candidateId = parseInt(id);
  if (isNaN(candidateId)) redirect("/results");

  const { db: tdb, schema: s, close } = await getTenantDb(session.user.schoolNumber);

  let candidate: typeof s.candidates.$inferSelect | null = null;
  let results: (typeof s.results.$inferSelect)[] = [];
  let flags: typeof s.qualificationFlags.$inferSelect | null = null;

  try {
    const rows = await tdb
      .select()
      .from(s.candidates)
      .where(eq(s.candidates.id, candidateId))
      .limit(1);

    candidate = rows[0] ?? null;
    if (!candidate) redirect("/results");

    const [res, fl] = await Promise.all([
      tdb.select().from(s.results).where(eq(s.results.candidateId, candidateId)),
      tdb.select().from(s.qualificationFlags).where(eq(s.qualificationFlags.candidateId, candidateId)).limit(1),
    ]);

    results = res;
    flags = fl[0] ?? null;
  } finally {
    await close();
  }

  const coreResults = results.filter((r) => r.isCore);
  const electiveResults = results.filter((r) => r.isElective);

  const qualStatus = flags?.qualifiesUniversity
    ? { label: "Qualifies", color: "#1A6B47", bg: "#E6F4EC" }
    : flags && flags.totalPasses >= 5
    ? { label: "Borderline", color: "#C07818", bg: "#FEF3E2" }
    : { label: "Does Not Qualify", color: "#B83232", bg: "#FDECEC" };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 6 }}>
            <Link href="/results" style={{ color: "#1A6B47", textDecoration: "none" }}>← Candidates</Link>
          </div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            {candidate!.fullName}
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            {candidate!.indexNumber} · {candidate!.programme} · {candidate!.gender === "F" ? "Female" : "Male"}
          </div>
        </div>
        {flags && (
          <div style={{ background: qualStatus.bg, color: qualStatus.color, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${qualStatus.color}40` }}>
            {qualStatus.label}
          </div>
        )}
      </div>

      {/* Qualification summary */}
      {flags && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Passes", value: flags.totalPasses },
            { label: "Core Passes", value: flags.corePasses },
            { label: "Elective Passes", value: flags.electivePasses },
            { label: "Best-Six Agg.", value: flags.bestSixAggregate ?? "—" },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 11, color: "#6B6860", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#0D1F17", fontFamily: "'Lora', serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results tables */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Core subjects */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 14 }}>Core Subjects</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {coreResults.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #E2E0D8" }}>
                  <td style={{ padding: "10px 0", color: "#0D1F17" }}>{r.subject}</td>
                  <td style={{ padding: "10px 0", textAlign: "right" }}>
                    <GradeBadge grade={r.grade as Grade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Elective subjects */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 14 }}>Elective Subjects</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {electiveResults.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #E2E0D8" }}>
                  <td style={{ padding: "10px 0", color: "#0D1F17" }}>{r.subject}</td>
                  <td style={{ padding: "10px 0", textAlign: "right" }}>
                    <GradeBadge grade={r.grade as Grade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* University pathways */}
      {flags && (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 14 }}>University Pathways</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {([
              ["Science", flags.qualifiesScience],
              ["Business", flags.qualifiesBusiness],
              ["Arts", flags.qualifiesArts],
              ["General", flags.qualifiesGeneral],
            ] as [string, boolean | null][]).map(([label, eligible]) => (
              <div
                key={label}
                style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: eligible ? "#E6F4EC" : "#F5F5F3",
                  color: eligible ? "#1A6B47" : "#9E9B94",
                  border: `1px solid ${eligible ? "#1A6B47" : "#E2E0D8"}`,
                }}
              >
                {eligible ? "✓" : "✕"} {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
