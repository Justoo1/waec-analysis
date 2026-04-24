import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { and, asc, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant";
import { AggBar } from "@/components/charts/AggBar";
import Link from "next/link";

const TH_STYLE: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left",
  fontSize: 11, fontWeight: 600, color: "#6B6860",
  textTransform: "uppercase", letterSpacing: "0.07em",
};

export default async function UniversityPage() {
  const session = await auth();
  if (!session?.user?.schoolNumber) redirect("/login");

  const { db: tdb, schema: s, close } = await getTenantDb(session.user.schoolNumber);
  const { qualificationFlags: qf, candidates: c } = s;

  let summary = { totalCandidates: 0, qualifiers: 0, borderline: 0, noQualify: 0, qualifyPct: 0, borderlinePct: 0, noQualifyPct: 0 };
  let byProgramme: { name: string; qualify: number; total: number; pct: number }[] = [];
  let aggDistribution: { agg: number | null; count: number }[] = [];
  let borderlineCands: { id: number; indexNumber: string; fullName: string | null; programme: string | null; totalPasses: number | null }[] = [];

  try {
    const [counts] = await tdb
      .select({
        qualifiers: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        borderline: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} >= 5 THEN 1 ELSE 0 END)`,
        noQualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} < 5 THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(qf);

    const prog = await tdb
      .select({
        programme: c.programme,
        qualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .groupBy(c.programme);

    const agg = await tdb
      .select({ agg: qf.bestSixAggregate, count: count() })
      .from(qf)
      .where(isNotNull(qf.bestSixAggregate))
      .groupBy(qf.bestSixAggregate)
      .orderBy(asc(qf.bestSixAggregate));

    const borderline = await tdb
      .select({ id: c.id, indexNumber: c.indexNumber, fullName: c.fullName, programme: c.programme, totalPasses: qf.totalPasses })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .where(and(eq(qf.qualifiesUniversity, false), gte(qf.totalPasses, 5)))
      .orderBy(asc(qf.totalPasses))
      .limit(20);

    const total = parseInt(String(counts?.total ?? 0));
    const pct = (n: number) => total > 0 ? parseFloat(((n / total) * 100).toFixed(1)) : 0;
    const qualifiers = parseInt(counts?.qualifiers ?? "0");
    const borderlineCount = parseInt(counts?.borderline ?? "0");
    const noQualify = parseInt(counts?.noQualify ?? "0");

    summary = { totalCandidates: total, qualifiers, borderline: borderlineCount, noQualify, qualifyPct: pct(qualifiers), borderlinePct: pct(borderlineCount), noQualifyPct: pct(noQualify) };
    byProgramme = prog.map((p) => {
      const t = parseInt(String(p.total));
      const q = parseInt(p.qualify);
      return { name: p.programme ?? "Unknown", qualify: q, total: t, pct: t > 0 ? parseFloat(((q / t) * 100).toFixed(1)) : 0 };
    });
    aggDistribution = agg.map((a) => ({ agg: a.agg, count: parseInt(String(a.count)) }));
    borderlineCands = borderline;
  } finally {
    await close();
  }

  const HERO_CARDS = [
    { label: "QUALIFY",        value: summary.qualifiers, pct: `${summary.qualifyPct}%`,    accent: "#1A6B47", bg: "#E6F4EC", text: "#1A6B47" },
    { label: "BORDERLINE",     value: summary.borderline, pct: `${summary.borderlinePct}%`, accent: "#C07818", bg: "#FEF3E2", text: "#C07818" },
    { label: "DO NOT QUALIFY", value: summary.noQualify,  pct: `${summary.noQualifyPct}%`,  accent: "#B83232", bg: "#FDECEC", text: "#B83232" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>University Qualification</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>Best-six aggregate analysis</div>
        </div>
      </div>

      {summary.totalCandidates === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 60, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          No results data yet. <Link href="/upload" style={{ color: "#1A6B47" }}>Upload results →</Link>
        </div>
      ) : (
        <>
          {/* Hero cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {HERO_CARDS.map((card) => (
              <div key={card.label} style={{ flex: 1, background: card.bg, borderRadius: 8, padding: 24, borderTop: `4px solid ${card.accent}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: card.text, marginBottom: 10 }}>{card.label}</div>
                <div style={{ fontSize: 40, fontWeight: 600, color: card.text, fontFamily: "'Lora', serif", lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 16, color: card.text, marginTop: 6, opacity: 0.8 }}>{card.pct} of cohort</div>
              </div>
            ))}
          </div>

          {/* Aggregate distribution */}
          {aggDistribution.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 4 }}>Aggregate Distribution</div>
              <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 16 }}>Best-six aggregate scores across qualifying candidates</div>
              <AggBar data={aggDistribution as { agg: number; count: number }[]} />
              <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center" }}>
                {([ ["#1A6B47", "Competitive (≤24)"], ["#C07818", "Good (25–30)"], ["#B83232", "Marginal (31+)"] ] as [string, string][]).map(([col, lbl]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B6860" }}>
                    <div style={{ width: 10, height: 10, background: col, borderRadius: 2 }} /> {lbl}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Programme breakdown */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>Qualification by Programme</div>
            {byProgramme.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid #E2E0D8" }}>
                <div style={{ width: 120, fontSize: 13, color: "#0D1F17", fontWeight: 500 }}>{p.name}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: "#F0EDE6", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: p.pct >= 80 ? "#1A6B47" : p.pct >= 70 ? "#C07818" : "#B83232", borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
                <div style={{ width: 80, fontSize: 12, textAlign: "right", color: "#6B6860" }}>{p.qualify} / {p.total}</div>
                <div style={{ width: 48, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: p.pct >= 80 ? "#1A6B47" : "#C07818", textAlign: "right" }}>{p.pct}%</div>
              </div>
            ))}
          </div>

          {/* Borderline intervention table */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>Candidates Needing Intervention</div>
              <span style={{ background: "#FEF3E2", color: "#C07818", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{summary.borderline} students</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 16 }}>Students with 5 passes — one more subject could qualify them</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E0D8" }}>
                  {["Index", "Name", "Programme", "Passes"].map((h) => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {borderlineCands.map((cand, i) => (
                  <tr key={cand.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: "1px solid #E2E0D8" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B6860" }}>{cand.indexNumber}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 500, color: "#0D1F17" }}>{cand.fullName}</td>
                    <td style={{ padding: "10px 12px", color: "#6B6860" }}>{cand.programme}</td>
                    <td style={{ padding: "10px 12px", color: "#C07818", fontWeight: 600 }}>{cand.totalPasses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontSize: 12, color: "#6B6860" }}>
              Showing {borderlineCands.length} of {summary.borderline} borderline candidates —{" "}
              <Link href="/results?status=borderline" style={{ color: "#1A6B47", textDecoration: "underline" }}>view all →</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
