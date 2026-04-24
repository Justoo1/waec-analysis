/**
 * Creates a super_admin user in the public.users table.
 * Usage: node scripts/create-super-admin.mjs
 * Env:   DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */

import postgres from "postgres";
import { hash } from "bcryptjs";

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

const missing = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME"].filter(
  (k) => !process.env[k]
);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  const existing = await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1`;
  if (existing.length > 0) {
    console.error(`A user with email "${ADMIN_EMAIL}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await hash(ADMIN_PASSWORD, 12);

  const [user] = await sql`
    INSERT INTO users (email, password_hash, full_name, role, school_id, is_active)
    VALUES (${ADMIN_EMAIL}, ${passwordHash}, ${ADMIN_NAME}, 'super_admin', NULL, true)
    RETURNING id, email, full_name, role
  `;

  console.log("Super admin created:");
  console.log(`  ID:    ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name:  ${user.full_name}`);
  console.log(`  Role:  ${user.role}`);
} finally {
  await sql.end();
}
