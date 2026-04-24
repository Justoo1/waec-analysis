import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { resolveTenantContext, isMissingSchemaError } from "@/lib/api-utils";

export async function GET() {
  const { context, error } = await resolveTenantContext();
  if (error) return error;

  const { db: tdb, schema: s, close } = context.tenantDb;

  try {
    const sittings = await tdb
      .select()
      .from(s.examSittings)
      .orderBy(desc(s.examSittings.year));

    return NextResponse.json({ sittings });
  } catch (err: unknown) {
    if (isMissingSchemaError(err)) return NextResponse.json({ sittings: [] });
    throw err;
  } finally {
    await close();
  }
}
