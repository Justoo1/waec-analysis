import { NextResponse } from "next/server";
import { sql, count, desc } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/api-utils";

export async function GET() {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { qualificationFlags: qf, results: r, examSittings: es } = s;

  try {
    // Qualification counts
    const [qualCounts] = await tdb
      .select({
        qualifies: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        borderline: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} >= 5 THEN 1 ELSE 0 END)`,
        noQualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} < 5 THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(qf);

    // Overall pass rate across all results
    const [passRow] = await tdb
      .select({
        passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(r);

    // Best subject by pass rate (min 5 candidates so small pilots don't distort)
    const subjectRates = await tdb
      .select({
        subject: r.subject,
        passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(r)
      .groupBy(r.subject)
      .having(sql`COUNT(*) >= 5`);

    const byRate = subjectRates
      .map((row) => ({
        name: row.subject,
        passRate: parseInt(row.passes) / parseInt(String(row.total)),
      }))
      .sort((a, b) => b.passRate - a.passRate);

    // Latest sitting
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

    const pct = (n: number) =>
      totalQ > 0 ? parseFloat(((n / totalQ) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      totalCandidates: totalQ,
      qualifiers,
      borderline,
      noQualify,
      qualifyPct: pct(qualifiers),
      borderlinePct: pct(borderline),
      noQualifyPct: pct(noQualify),
      overallPassRate:
        totalResults > 0
          ? parseFloat(((passes / totalResults) * 100).toFixed(1))
          : 0,
      bestSubject: byRate[0]?.name ?? null,
      lastUpdated: latest?.parsedAt ?? null,
      latestYear: latest?.year ?? null,
    });
  } finally {
    await close();
  }
}
