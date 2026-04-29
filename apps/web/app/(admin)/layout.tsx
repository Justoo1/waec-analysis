import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "./_components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/");

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      <header
        style={{
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
          WASSCE Analytics — Super Admin
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>{session.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {children}
      </main>
    </div>
  );
}
