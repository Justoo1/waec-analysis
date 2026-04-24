import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, provisionTenantSchema } from "@/lib/db/tenant";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const schoolId = parseInt(id);
  if (isNaN(schoolId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [school] = await db
    .select({ schoolNumber: schools.schoolNumber })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  await provisionTenantSchema(school.schoolNumber);

  return NextResponse.json({ ok: true, schoolNumber: school.schoolNumber });
}
