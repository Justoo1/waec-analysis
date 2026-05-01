import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "super_admin") redirect("/admin");

  return (
    <DashboardShell
      userEmail={session.user.email ?? ""}
      schoolName={session.user.schoolName ?? ""}
      schoolNumber={session.user.schoolNumber ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
