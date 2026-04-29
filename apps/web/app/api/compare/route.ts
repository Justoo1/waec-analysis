import { NextResponse } from "next/server";
import { count, eq, inArray, sql } from "drizzle-orm";
import { resolveTenantContext, isMissingSchemaError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { results: r, candidates: c, examSittings: es, qualificationFlags: qf } = s;

  const { searchParams } = new URL(request.url);
  const yearsParam = searchParams.get("years") ?? "";
  const years = yearsParam
    .split(",")
    .map(Number)
    .filter((y) => !isNaN(y) && y > 2000 && y < 2100);

  if (years.length === 0) {
    await close();
    return NextResponse.json(
      { error: "Provide at least one year via ?years=2023,2024" },
      { status: 400 }
    );
  }

  try {
    const [subjectRows, candidateRows, passRows, qualRows] = await Promise.all([
      // Subject-level pass rates
      tdb
        .select({
          year: es.year,
          subject: r.subject,
          passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
          total: count(),
        })
        .from(r)
        .innerJoin(c, eq(r.candidateId, c.id))
        .innerJoin(es, eq(c.sittingId, es.id))
        .where(inArray(es.year, years))
        .groupBy(es.year, r.subject),

      // Total candidates per year
      tdb
        .select({ year: es.year, total: sql<string>`COUNT(DISTINCT ${c.id})` })
        .from(c)
        .innerJoin(es, eq(c.sittingId, es.id))
        .where(inArray(es.year, years))
        .groupBy(es.year),

      // Overall pass rate per year (across all result rows)
      tdb
        .select({
          year: es.year,
          passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
          total: count(),
        })
        .from(r)
        .innerJoin(c, eq(r.candidateId, c.id))
        .innerJoin(es, eq(c.sittingId, es.id))
        .where(inArray(es.year, years))
        .groupBy(es.year),

      // University qualifiers per year
      tdb
        .select({ year: es.year, qualifiers: count() })
        .from(qf)
        .innerJoin(c, eq(qf.candidateId, c.id))
        .innerJoin(es, eq(c.sittingId, es.id))
        .where(inArray(es.year, years))
        .groupBy(es.year),
    ]);

    // Pivot subject data: { subject: string; [year]: passRate }[]
    const pivot = new Map<string, Record<string, number | string>>();
    for (const row of subjectRows) {
      if (!pivot.has(row.subject)) {
        pivot.set(row.subject, { subject: row.subject });
      }
      const total = parseInt(String(row.total));
      const passes = parseInt(row.passes);
      const passRate = total > 0 ? parseFloat(((passes / total) * 100).toFixed(1)) : 0;
      pivot.get(row.subject)![String(row.year)] = passRate;
    }

    // Build summary map
    type YearSummary = { totalCandidates: number; passRate: number; uniQualifiers: number };
    const summary: Record<string, YearSummary> = {};
    for (const yr of years) {
      summary[String(yr)] = { totalCandidates: 0, passRate: 0, uniQualifiers: 0 };
    }
    for (const row of candidateRows) {
      summary[String(row.year)].totalCandidates = parseInt(String(row.total));
    }
    for (const row of passRows) {
      const total = parseInt(String(row.total));
      const passes = parseInt(row.passes);
      summary[String(row.year)].passRate =
        total > 0 ? parseFloat(((passes / total) * 100).toFixed(1)) : 0;
    }
    for (const row of qualRows) {
      summary[String(row.year)].uniQualifiers = Number(row.qualifiers);
    }

    return NextResponse.json({
      data: [...pivot.values()],
      years: years.map(String),
      summary,
    });
  } catch (err: unknown) {
    if (isMissingSchemaError(err))
      return NextResponse.json({ data: [], years: years.map(String), summary: {} });
    throw err;
  } finally {
    await close();
  }
}
