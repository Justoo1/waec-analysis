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
 * Creates the tenant_${schoolNumber} schema and all four tables if they
 * don't already exist. Safe to call on every school creation (idempotent).
 */
export async function provisionTenantSchema(schoolNumber: string): Promise<void> {
  const s = `tenant_${schoolNumber}`;
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await client.unsafe(`CREATE SCHEMA IF NOT EXISTS "${s}"`);
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}".exam_sittings (
        id               SERIAL PRIMARY KEY,
        year             INTEGER      NOT NULL,
        exam_type        VARCHAR(50)  NOT NULL DEFAULT 'WASSCE',
        total_candidates INTEGER,
        source_file      VARCHAR(500),
        parsed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (year, exam_type)
      )
    `);
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}".candidates (
        id            SERIAL PRIMARY KEY,
        sitting_id    INTEGER      NOT NULL
                          REFERENCES "${s}".exam_sittings(id) ON DELETE CASCADE,
        index_number  VARCHAR(20)  NOT NULL,
        full_name     VARCHAR(255),
        gender        CHAR(1),
        date_of_birth DATE,
        programme     VARCHAR(100),
        UNIQUE (sitting_id, index_number)
      )
    `);
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}".results (
        id           SERIAL PRIMARY KEY,
        candidate_id INTEGER      NOT NULL
                         REFERENCES "${s}".candidates(id) ON DELETE CASCADE,
        subject      VARCHAR(200) NOT NULL,
        grade        VARCHAR(5)   NOT NULL,
        grade_score  INTEGER      NOT NULL,
        is_core      BOOLEAN      NOT NULL DEFAULT FALSE,
        is_elective  BOOLEAN      NOT NULL DEFAULT FALSE
      )
    `);
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}".qualification_flags (
        candidate_id         INTEGER  PRIMARY KEY
                                 REFERENCES "${s}".candidates(id) ON DELETE CASCADE,
        qualifies_university BOOLEAN  NOT NULL DEFAULT FALSE,
        qualifies_science    BOOLEAN  NOT NULL DEFAULT FALSE,
        qualifies_business   BOOLEAN  NOT NULL DEFAULT FALSE,
        qualifies_arts       BOOLEAN  NOT NULL DEFAULT FALSE,
        qualifies_general    BOOLEAN  NOT NULL DEFAULT FALSE,
        core_passes          INTEGER  NOT NULL DEFAULT 0,
        elective_passes      INTEGER  NOT NULL DEFAULT 0,
        total_passes         INTEGER  NOT NULL DEFAULT 0,
        best_six_aggregate   INTEGER,
        computed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } finally {
    await client.end();
  }
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
