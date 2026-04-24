import { NextResponse } from "next/server";
import { and, asc, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/api-utils";

export async function GET() {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { qualificationFlags: qf, candidates: c } = s;

  try {
    // Summary counts
    const [summary] = await tdb
      .select({
        qualifiers: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        borderline: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} >= 5 THEN 1 ELSE 0 END)`,
        noQualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} < 5 THEN 1 ELSE 0 END)`,
        total: count(),
        qualifiesScience: sql<string>`SUM(CASE WHEN ${qf.qualifiesScience} = true THEN 1 ELSE 0 END)`,
        qualifiesBusiness: sql<string>`SUM(CASE WHEN ${qf.qualifiesBusiness} = true THEN 1 ELSE 0 END)`,
        qualifiesArts: sql<string>`SUM(CASE WHEN ${qf.qualifiesArts} = true THEN 1 ELSE 0 END)`,
      })
      .from(qf);

    // Programme breakdown
    const byProgramme = await tdb
      .select({
        programme: c.programme,
        qualify: sql<string>`SUM(CASE WHEN ${qf.qualifiesUniversity} = true THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .groupBy(c.programme);

    // AGG distribution
    const aggDist = await tdb
      .select({
        agg: qf.bestSixAggregate,
        count: count(),
      })
      .from(qf)
      .where(isNotNull(qf.bestSixAggregate))
      .groupBy(qf.bestSixAggregate)
      .orderBy(asc(qf.bestSixAggregate));

    // Borderline candidates (need one more pass)
    const borderlineCands = await tdb
      .select({
        id: c.id,
        indexNumber: c.indexNumber,
        fullName: c.fullName,
        programme: c.programme,
        totalPasses: qf.totalPasses,
        corePasses: qf.corePasses,
        bestSixAggregate: qf.bestSixAggregate,
      })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .where(and(eq(qf.qualifiesUniversity, false), gte(qf.totalPasses, 5)))
      .orderBy(asc(qf.totalPasses))
      .limit(50);

    const total = parseInt(String(summary?.total ?? 0));
    const pct = (n: number) =>
      total > 0 ? parseFloat(((n / total) * 100).toFixed(1)) : 0;
    const qualifiers = parseInt(summary?.qualifiers ?? "0");
    const borderline = parseInt(summary?.borderline ?? "0");
    const noQualify = parseInt(summary?.noQualify ?? "0");

    return NextResponse.json({
      summary: {
        totalCandidates: total,
        qualifiers,
        borderline,
        noQualify,
        qualifyPct: pct(qualifiers),
        borderlinePct: pct(borderline),
        noQualifyPct: pct(noQualify),
        qualifiesScience: parseInt(summary?.qualifiesScience ?? "0"),
        qualifiesBusiness: parseInt(summary?.qualifiesBusiness ?? "0"),
        qualifiesArts: parseInt(summary?.qualifiesArts ?? "0"),
      },
      byProgramme: byProgramme.map((p) => ({
        name: p.programme ?? "Unknown",
        qualify: parseInt(p.qualify),
        total: parseInt(String(p.total)),
        pct:
          parseInt(String(p.total)) > 0
            ? parseFloat(
                ((parseInt(p.qualify) / parseInt(String(p.total))) * 100).toFixed(1)
              )
            : 0,
      })),
      aggDistribution: aggDist.map((a) => ({
        agg: a.agg,
        count: parseInt(String(a.count)),
      })),
      borderlineCandidates: borderlineCands,
    });
  } finally {
    await close();
  }
}
