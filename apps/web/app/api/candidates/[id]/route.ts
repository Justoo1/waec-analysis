import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/api-utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;
  const { candidates: c, results: r, qualificationFlags: qf } = s;

  const { id } = await params;
  const candidateId = parseInt(id);
  if (isNaN(candidateId)) {
    await close();
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const [candidate] = await tdb
      .select()
      .from(c)
      .where(eq(c.id, candidateId))
      .limit(1);

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const [results, flags] = await Promise.all([
      tdb.select().from(r).where(eq(r.candidateId, candidateId)),
      tdb.select().from(qf).where(eq(qf.candidateId, candidateId)).limit(1),
    ]);

    return NextResponse.json({
      candidate,
      results,
      qualificationFlags: flags[0] ?? null,
    });
  } finally {
    await close();
  }
}
