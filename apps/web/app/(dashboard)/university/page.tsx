import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { CandidatesTable } from "@/components/tables/CandidatesTable";

export default async function UniversityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // TODO: fetch qualification data from getTenantDb(schoolNumber)
  const candidates: Parameters<typeof CandidatesTable>[0]["data"] = [];
  const totalQualifying = 0;
  const qualifyingPct = 0;
  const avgBestSix = 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">University Qualification</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Qualifying" value={totalQualifying} />
        <StatCard title="Qualifying %" value={`${qualifyingPct}%`} />
        <StatCard title="Avg Best-6 Aggregate" value={avgBestSix || "—"} />
      </div>

      <CandidatesTable data={candidates} />
    </div>
  );
}
