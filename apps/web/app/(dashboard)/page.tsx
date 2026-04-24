import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql, count, desc } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant";
import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { CoreSubjectChart } from "@/components/charts/CoreSubjectChart";
import Link from "next/link";
import type { Subject } from "@/lib/mock-data";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.schoolNumber) redirect("/login");

  const { db: tdb, schema: s, close } = await getTenantDb(session.user.schoolNumber);
  const { qualificationFlags: qf, results: r, examSittings: es } = s;

  let stats = {
    totalCandidates: 0, qualifiers: 0, borderline: 0, noQualify: 0,
    qualifyPct: 0, borderlinePct: 0, noQualifyPct: 0,
    overallPassRate: 0, bestSubject: "—", latestYear: null as number | null,
    lastUpdated: null as Date | null,
  };
  let subjects: Subject[] = [];

  try {
    const [qualCounts] = await tdb
      .select({
        qualifies: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        borderline: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} >= 5 THEN 1 ELSE 0 END)`,
        noQualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} < 5 THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(qf);

    const [passRow] = await tdb
      .select({
        passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(r);

    const subjectRates = await tdb
      .select({
        subject: r.subject,
        passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
        total: count(),
        A1: sql<string>`SUM(CASE WHEN ${r.grade} = 'A1' THEN 1 ELSE 0 END)`,
        B2: sql<string>`SUM(CASE WHEN ${r.grade} = 'B2' THEN 1 ELSE 0 END)`,
        B3: sql<string>`SUM(CASE WHEN ${r.grade} = 'B3' THEN 1 ELSE 0 END)`,
        C4: sql<string>`SUM(CASE WHEN ${r.grade} = 'C4' THEN 1 ELSE 0 END)`,
        C5: sql<string>`SUM(CASE WHEN ${r.grade} = 'C5' THEN 1 ELSE 0 END)`,
        C6: sql<string>`SUM(CASE WHEN ${r.grade} = 'C6' THEN 1 ELSE 0 END)`,
        D7: sql<string>`SUM(CASE WHEN ${r.grade} = 'D7' THEN 1 ELSE 0 END)`,
        E8: sql<string>`SUM(CASE WHEN ${r.grade} = 'E8' THEN 1 ELSE 0 END)`,
        F9: sql<string>`SUM(CASE WHEN ${r.grade} = 'F9' THEN 1 ELSE 0 END)`,
      })
      .from(r)
      .groupBy(r.subject)
      .having(sql`COUNT(*) >= 5`);

    const [latest] = await tdb
      .select({ year: es.year, parsedAt: es.parsedAt })
      .from(es)
      .orderBy(desc(es.year))
      .limit(1);

    const totalQ = parseInt(String(qualCounts?.total ?? 0));
    const qualifiers = parseInt(qualCounts?.qualifies ?? "0");
    const borderline = parseInt(qualCounts?.borderline ?? "0");
    const noQualify = parseInt(qualCounts?.noQualify ?? "0");
    const totalResults = parseInt(String(passRow?.total ?? 0));
    const passes = parseInt(passRow?.passes ?? "0");
    const pct = (n: number) => totalQ > 0 ? parseFloat(((n / totalQ) * 100).toFixed(1)) : 0;

    subjects = subjectRates.map((row) => {
      const t = parseInt(String(row.total));
      const p = parseInt(row.passes);
      return {
        name: row.subject,
        code: row.subject.slice(0, 6).toUpperCase(),
        cands: t,
        passRate: t > 0 ? parseFloat(((p / t) * 100).toFixed(1)) : 0,
        grades: {
          A1: parseInt(row.A1), B2: parseInt(row.B2), B3: parseInt(row.B3),
          C4: parseInt(row.C4), C5: parseInt(row.C5), C6: parseInt(row.C6),
          D7: parseInt(row.D7), E8: parseInt(row.E8), F9: parseInt(row.F9),
        },
      };
    });

    const bestSubject = [...subjects].sort((a, b) => b.passRate - a.passRate)[0]?.name ?? "—";

    stats = {
      totalCandidates: totalQ, qualifiers, borderline, noQualify,
      qualifyPct: pct(qualifiers), borderlinePct: pct(borderline), noQualifyPct: pct(noQualify),
      overallPassRate: totalResults > 0 ? parseFloat(((passes / totalResults) * 100).toFixed(1)) : 0,
      bestSubject,
      latestYear: latest?.year ?? null,
      lastUpdated: latest?.parsedAt ?? null,
    };
  } finally {
    await close();
  }

  const topSubjects = [...subjects].sort((a, b) => b.passRate - a.passRate).slice(0, 5);
  const bottomSubjects = [...subjects].sort((a, b) => a.passRate - b.passRate).slice(0, 5);

  const DONUT_SEGMENTS = [
    { value: stats.qualifyPct,    color: "#1A6B47", label: `${stats.qualifyPct}%`, sub: "Qualifying" },
    { value: stats.borderlinePct, color: "#C07818" },
    { value: stats.noQualifyPct,  color: "#B83232" },
  ];

  const LEGEND = [
    { label: "Qualifies",        value: stats.qualifiers, pct: stats.qualifyPct,    color: "#1A6B47" },
    { label: "Borderline",       value: stats.borderline, pct: stats.borderlinePct, color: "#C07818" },
    { label: "Does not qualify", value: stats.noQualify,  pct: stats.noQualifyPct,  color: "#B83232" },
  ];

  const noData = stats.totalCandidates === 0;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            WASSCE {stats.latestYear ?? "—"} — Overview
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            School: {session.user.name ?? session.user.email}
          </div>
        </div>
        {stats.lastUpdated && (
          <span style={{ fontSize: 11, color: "#6B6860" }}>
            Last updated: {new Date(stats.lastUpdated).toLocaleString("en-GB")}
          </span>
        )}
      </div>

      {noData ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 60, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "#0D1F17" }}>No results uploaded yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Upload your WAEC results file to start analysing</div>
          <Link href="/upload" style={{ background: "#1A6B47", color: "#fff", padding: "8px 20px", borderRadius: 6, fontSize: 13, textDecoration: "none" }}>
            Upload results →
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <StatCard label="Total Candidates" value={stats.totalCandidates} sub={`WASSCE ${stats.latestYear}`} />
            <StatCard label="University Qualifiers" value={stats.qualifiers} sub={`${stats.qualifyPct}% of cohort`} subColor="#1A6B47" />
            <StatCard label="Overall Pass Rate" value={`${stats.overallPassRate}%`} sub="Across all subjects" />
            <StatCard label="Best Subject" value={stats.bestSubject} sub="Highest pass rate" accent="#2E7D7A" />
          </div>

          {/* Charts row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
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
            <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>Core Subject Grade Distribution</div>
              <CoreSubjectChart subjects={subjects} />
            </div>
          </div>

          {/* Subject performance summary */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>Subject Performance Summary</div>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { title: "↑ Top performing",  items: topSubjects,    color: "#1A6B47" },
                { title: "↓ Needs attention", items: bottomSubjects, color: "#B83232" },
              ].map((col) => (
                <div key={col.title} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 10 }}>
                    {col.title}
                  </div>
                  {col.items.map((sub, i) => (
                    <div key={sub.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 5, background: i % 2 === 0 ? "#FAFAF8" : "#fff", fontSize: 13 }}>
                      <span style={{ color: "#0D1F17" }}>{sub.name}</span>
                      <span style={{ fontWeight: 600, color: col.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {sub.passRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Link href="/subjects" style={{ fontSize: 12, color: "#1A6B47", textDecoration: "underline" }}>
                View full subject analysis →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
