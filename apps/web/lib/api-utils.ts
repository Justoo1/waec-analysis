import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/db/tenant";

export type TenantContext = {
  tenantDb: Awaited<ReturnType<typeof getTenantDb>>;
  schoolNumber: string;
  userId: string;
};

type TenantResult =
  | { context: TenantContext; error: null }
  | { context: null; error: NextResponse };

/**
 * Returns true if the error is a PostgreSQL "relation does not exist" (42P01).
 * Use this to return empty data instead of a 500 for tenants with no schema yet.
 */
export function isMissingSchemaError(err: unknown): boolean {
  return (err as { cause?: { code?: string } })?.cause?.code === "42P01";
}

/**
 * Resolves the authenticated tenant context for an API route handler.
 * The caller MUST call tenantDb.close() in a finally block to prevent
 * connection pool leaks.
 */
export async function resolveTenantContext(): Promise<TenantResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const schoolNumber = session.user.schoolNumber;
  if (!schoolNumber) {
    return {
      context: null,
      error: NextResponse.json(
        { error: "No tenant associated with this account" },
        { status: 403 }
      ),
    };
  }

  const tenantDb = await getTenantDb(schoolNumber);
  return {
    context: { tenantDb, schoolNumber, userId: session.user.id },
    error: null,
  };
}
