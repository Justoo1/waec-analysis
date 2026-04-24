import { NextResponse } from "next/server";
import { and, asc, count, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import { resolveTenantContext, isMissingSchemaError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { candidates: c, qualificationFlags: qf } = s;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const programme = searchParams.get("programme") ?? "";
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

    const conditions = [];
    if (sittingId) conditions.push(eq(c.sittingId, sittingId));

    if (search) {
      conditions.push(
        or(
          ilike(c.fullName, `%${search}%`),
          ilike(c.indexNumber, `%${search}%`)
        )
      );
    }
    if (programme) {
      conditions.push(eq(c.programme, programme));
    }
    if (status === "qualify") {
      conditions.push(eq(qf.qualifiesUniversity, true));
    } else if (status === "borderline") {
      conditions.push(
        and(eq(qf.qualifiesUniversity, false), gte(qf.totalPasses, 5))
      );
    } else if (status === "no-qualify") {
      conditions.push(
        and(eq(qf.qualifiesUniversity, false), lt(qf.totalPasses, 5))
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await tdb
      .select({ total: count() })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .where(where);

    const rows = await tdb
      .select({
        id: c.id,
        indexNumber: c.indexNumber,
        fullName: c.fullName,
        gender: c.gender,
        dateOfBirth: c.dateOfBirth,
        programme: c.programme,
        sittingId: c.sittingId,
        qualifiesUniversity: qf.qualifiesUniversity,
        qualifiesScience: qf.qualifiesScience,
        qualifiesBusiness: qf.qualifiesBusiness,
        qualifiesArts: qf.qualifiesArts,
        totalPasses: qf.totalPasses,
        corePasses: qf.corePasses,
        electivePasses: qf.electivePasses,
        bestSixAggregate: qf.bestSixAggregate,
        status: sql<string>`
          CASE
            WHEN ${qf.qualifiesUniversity} = true THEN 'qualify'
            WHEN ${qf.qualifiesUniversity} = false AND ${qf.totalPasses} >= 5 THEN 'borderline'
            ELSE 'no-qualify'
          END
        `,
      })
      .from(c)
      .innerJoin(qf, eq(qf.candidateId, c.id))
      .where(where)
      .orderBy(asc(c.indexNumber))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      candidates: rows,
      pagination: {
        page,
        limit,
        total: parseInt(String(total)),
        pages: Math.ceil(parseInt(String(total)) / limit),
      },
    });
  } catch (err: unknown) {
    if (isMissingSchemaError(err)) {
      return NextResponse.json({
        candidates: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }
    throw err;
  } finally {
    await close();
  }
}
