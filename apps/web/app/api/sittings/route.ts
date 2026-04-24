import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/api-utils";

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
  } finally {
    await close();
  }
}
