import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/tenant";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: "Account has no password set" }, { status: 400 });
  }

  const valid = compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const passwordHash = await hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
