import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, provisionTenantSchema } from "@/lib/db/tenant";
import { schools, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { hash } from "bcryptjs";

async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const authErr = await requireSuperAdmin();
  if (authErr) return authErr;

  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      schoolNumber: schools.schoolNumber,
      subdomain: schools.subdomain,
      region: schools.region,
      district: schools.district,
      schoolType: schools.schoolType,
      plan: schools.plan,
      isActive: schools.isActive,
      createdAt: schools.createdAt,
      userCount: sql<string>`count(${users.id})`,
      adminEmail: sql<string | null>`(
        SELECT email FROM users
        WHERE school_id = ${schools.id}
        ORDER BY id ASC
        LIMIT 1
      )`,
    })
    .from(schools)
    .leftJoin(users, eq(users.schoolId, schools.id))
    .groupBy(schools.id)
    .orderBy(desc(schools.createdAt));

  return NextResponse.json(
    rows.map((r) => ({ ...r, userCount: parseInt(r.userCount ?? "0") }))
  );
}

const registerSchema = z.object({
  name: z.string().min(3, "School name is required"),
  schoolNumber: z
    .string()
    .regex(/^\d{7}$/, "School number must be exactly 7 digits"),
  subdomain: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Subdomain may only contain lowercase letters, numbers, and hyphens"),
  region: z.string().optional(),
  district: z.string().optional(),
  schoolType: z.string().default("SHS"),
  plan: z.enum(["free", "basic", "pro"]).default("free"),
  adminFullName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const authErr = await requireSuperAdmin();
  if (authErr) return authErr;

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    name, schoolNumber, subdomain, region, district,
    schoolType, plan, adminFullName, adminEmail, adminPassword,
  } = parsed.data;

  const passwordHash = await hash(adminPassword, 12);

  // Check uniqueness before inserting
  const existing = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.schoolNumber, schoolNumber))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A school with that school number already exists" },
      { status: 409 }
    );
  }

  const existingSubdomain = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.subdomain, subdomain))
    .limit(1);

  if (existingSubdomain.length > 0) {
    return NextResponse.json(
      { error: "That subdomain is already taken" },
      { status: 409 }
    );
  }

  // Insert school then admin user
  const [school] = await db
    .insert(schools)
    .values({ name, schoolNumber, subdomain, region, district, schoolType, plan })
    .returning({ id: schools.id, schoolNumber: schools.schoolNumber });

  await db.insert(users).values({
    schoolId: school.id,
    email: adminEmail,
    passwordHash,
    fullName: adminFullName,
    role: "admin",
    isActive: true,
  });

  await provisionTenantSchema(school.schoolNumber);

  return NextResponse.json({ school }, { status: 201 });
}
