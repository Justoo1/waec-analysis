import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/tenant";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hash } from "bcryptjs";

async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Find the admin user for this school
  const adminUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.schoolId, schoolId))
    .limit(1)
    .then((r) => r[0]);

  if (!adminUser) {
    return NextResponse.json({ error: "No user found for this school" }, { status: 404 });
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, adminUser.id));

  return NextResponse.json({ ok: true });
}
