import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LogoutButton } from "./_components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/");

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/icon.svg" alt="" width={28} height={28} style={{ borderRadius: 6, flexShrink: 0 }} />
          <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
            WASSCE Analytics
          </span>
          <span style={{ color: "#475569", fontSize: 13, fontWeight: 400 }}>— Super Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="admin-header-email" style={{ color: "#94a3b8", fontSize: 13 }}>{session.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {children}
      </main>
    </div>
  );
}
