import { NextResponse } from "next/server";
import { count, eq, inArray, sql } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { results: r, candidates: c, examSittings: es } = s;

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
    const rows = await tdb
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
      .groupBy(es.year, r.subject);

    // Pivot: { subject: string; [year]: passRate }[]
    const pivot = new Map<string, Record<string, number | string>>();
    for (const row of rows) {
      if (!pivot.has(row.subject)) {
        pivot.set(row.subject, { subject: row.subject });
      }
      const total = parseInt(String(row.total));
      const passes = parseInt(row.passes);
      const passRate = total > 0 ? parseFloat(((passes / total) * 100).toFixed(1)) : 0;
      pivot.get(row.subject)![String(row.year)] = passRate;
    }

    return NextResponse.json({
      data: [...pivot.values()],
      years: years.map(String),
    });
  } finally {
    await close();
  }
}
