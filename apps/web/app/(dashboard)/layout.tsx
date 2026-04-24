import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar userEmail={session.user.email ?? ""} />
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
