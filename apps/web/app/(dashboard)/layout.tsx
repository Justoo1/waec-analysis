import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "super_admin") redirect("/admin");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Suspense fallback={<div style={{ width: 240, flexShrink: 0, background: "#0D1F17", height: "100vh" }} />}>
        <Sidebar
          userEmail={session.user.email ?? ""}
          schoolName={session.user.schoolName ?? ""}
          schoolNumber={session.user.schoolNumber ?? ""}
        />
      </Suspense>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 36px",
          background: "#F7F6F2",
        }}
      >
        {children}
      </main>
    </div>
  );
}
