import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubjectSummaryTable } from "@/components/tables/SubjectSummaryTable";
import { SubjectPassRateChart } from "@/components/charts/SubjectPassRateChart";

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // TODO: fetch subject summaries from getTenantDb(schoolNumber)
  const subjects: Parameters<typeof SubjectSummaryTable>[0]["data"] = [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Subject Analysis</h1>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-semibold">Pass Rate by Subject</h2>
        <SubjectPassRateChart data={[]} />
      </div>

      <SubjectSummaryTable data={subjects} />
    </div>
  );
}
