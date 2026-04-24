import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/tenant";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
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

        // TODO: replace with bcrypt once DB is seeded
        // const { compare } = await import("bcryptjs")
        // if (!(await compare(password, user.passwordHash ?? ""))) return null
        void password;

        return {
          id: String(user.id),
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string | null }).role;
        token.schoolId = (user as { schoolId?: number | null }).schoolId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      session.user.schoolId = token.schoolId as number | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

// Extend Auth.js Session type with WAEC-specific fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      schoolId: number | null;
    };
  }
}
