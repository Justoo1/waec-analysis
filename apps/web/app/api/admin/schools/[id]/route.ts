import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/tenant";
import { schools, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  schoolType: z.string().optional(),
  plan: z.enum(["free", "basic", "pro"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireSuperAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const schoolId = parseInt(id);
  if (isNaN(schoolId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(schools)
    .set(parsed.data)
    .where(eq(schools.id, schoolId))
    .returning();

  if (!updated) return NextResponse.json({ error: "School not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireSuperAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const schoolId = parseInt(id);
  if (isNaN(schoolId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Delete users first (no cascade on FK from users → schools)
  await db.delete(users).where(eq(users.schoolId, schoolId));
  await db.delete(schools).where(eq(schools.id, schoolId));

  return new NextResponse(null, { status: 204 });
}
