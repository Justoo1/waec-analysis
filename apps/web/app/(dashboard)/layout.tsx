import { ThemeProvider } from "next-themes";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/results", label: "Results" },
  { href: "/subjects", label: "Subjects" },
  { href: "/university", label: "University" },
  { href: "/compare", label: "Compare" },
  { href: "/upload", label: "Upload" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-col border-r bg-muted/40 p-4 md:flex">
          <div className="mb-6">
            <span className="text-sm font-semibold tracking-tight">
              WAEC Analytics
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto text-xs text-muted-foreground">
            {session.user.email}
          </div>
        </aside>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ThemeProvider>
  );
}
