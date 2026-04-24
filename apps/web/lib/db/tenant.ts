import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTenantSchema, schools } from "./schema";
import { eq } from "drizzle-orm";

// Global public-schema client — reused across requests (connection pool)
const globalClient = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
});

export const db = drizzle(globalClient);

/**
 * Returns a Drizzle client whose search_path is set to the tenant schema
 * so that unqualified table references resolve to the school's own tables.
 */
export async function getTenantDb(schoolNumber: string) {
  const tenantClient = postgres(process.env.DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
    connection: {
      search_path: `tenant_${schoolNumber},public`,
    },
  });

  return {
    db: drizzle(tenantClient),
    schema: getTenantSchema(schoolNumber),
    close: () => tenantClient.end(),
  };
}

/**
 * Look up a school by subdomain. Used by proxy.ts and API routes.
 */
export async function getSchoolBySubdomain(
  subdomain: string
): Promise<{ id: number; schoolNumber: string; name: string } | null> {
  const result = await db
    .select({
      id: schools.id,
      schoolNumber: schools.schoolNumber,
      name: schools.name,
    })
    .from(schools)
    .where(eq(schools.subdomain, subdomain))
    .limit(1);

  return result[0] ?? null;
}
