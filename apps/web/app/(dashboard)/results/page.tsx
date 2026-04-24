import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CandidatesTable } from "@/components/tables/CandidatesTable";

export default async function ResultsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // TODO: fetch candidates from getTenantDb(schoolNumber)
  const candidates: Parameters<typeof CandidatesTable>[0]["data"] = [];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">All Candidates</h1>
      <CandidatesTable data={candidates} />
    </div>
  );
}
