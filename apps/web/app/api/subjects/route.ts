import { NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { resolveTenantContext, isMissingSchemaError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { results: r } = s;

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : null;

  try {
    // Resolve sittingId for year filter
    let sittingId: number | null = null;
    if (year) {
      const [sitting] = await tdb.select({ id: s.examSittings.id })
        .from(s.examSittings)
        .where(eq(s.examSittings.year, year))
        .limit(1);
      sittingId = sitting?.id ?? null;
    }

    const subjectCols = {
      subject: r.subject,
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
      passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
    };
    const orderExpr = desc(sql`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)::float / COUNT(*)`);

    const rows = await (sittingId
      ? tdb.select(subjectCols).from(r)
          .innerJoin(s.candidates, eq(r.candidateId, s.candidates.id))
          .where(eq(s.candidates.sittingId, sittingId))
          .groupBy(r.subject).orderBy(orderExpr)
      : tdb.select(subjectCols).from(r)
          .groupBy(r.subject).orderBy(orderExpr));

    const subjects = rows.map((row) => {
      const total = parseInt(String(row.total));
      const passes = parseInt(row.passes);
      return {
        name: row.subject,
        cands: total,
        passRate: total > 0 ? parseFloat(((passes / total) * 100).toFixed(1)) : 0,
        grades: {
          A1: parseInt(row.A1),
          B2: parseInt(row.B2),
          B3: parseInt(row.B3),
          C4: parseInt(row.C4),
          C5: parseInt(row.C5),
          C6: parseInt(row.C6),
          D7: parseInt(row.D7),
          E8: parseInt(row.E8),
          F9: parseInt(row.F9),
        },
      };
    });

    return NextResponse.json({ subjects });
  } catch (err: unknown) {
    if (isMissingSchemaError(err)) return NextResponse.json({ subjects: [] });
    throw err;
  } finally {
    await close();
  }
}
