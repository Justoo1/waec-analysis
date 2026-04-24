import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  // TODO: fetch candidate + results + qualification from getTenantDb
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Candidate Report</h1>
      <p className="text-sm text-muted-foreground">Candidate ID: {id}</p>
      <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
        Candidate detail view coming soon.
      </div>
    </div>
  );
}
