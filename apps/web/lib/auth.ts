import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db/tenant";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((r) => r[0]);

        if (!user || !user.isActive) return null;

        const { compare } = await import("bcryptjs");
        if (!(await compare(password, user.passwordHash ?? ""))) return null;

        // Fetch the school's subdomain-routable identifier and display name
        let schoolNumber: string | null = null;
        let schoolName: string | null = null;
        if (user.schoolId) {
          const school = await db
            .select({ schoolNumber: schools.schoolNumber, name: schools.name })
            .from(schools)
            .where(eq(schools.id, user.schoolId))
            .limit(1)
            .then((r) => r[0]);
          schoolNumber = school?.schoolNumber ?? null;
          schoolName = school?.name ?? null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          schoolNumber,
          schoolName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string | null }).role;
        token.schoolId = (user as { schoolId?: number | null }).schoolId;
        token.schoolNumber = (user as { schoolNumber?: string | null }).schoolNumber;
        token.schoolName = (user as { schoolName?: string | null }).schoolName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      session.user.schoolId = token.schoolId as number | null;
      session.user.schoolNumber = token.schoolNumber as string | null;
      session.user.schoolName = token.schoolName as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

// Extend Auth.js Session type with WASSCE-specific fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      schoolId: number | null;
      schoolNumber: string | null;
      schoolName: string | null;
    };
  }
}
