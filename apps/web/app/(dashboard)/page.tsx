import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentSubdomain } from "@/lib/tenant";
import { StatCard } from "@/components/dashboard/StatCard";
import { TenantHeader } from "@/components/dashboard/TenantHeader";
import { QualificationDonut } from "@/components/charts/QualificationDonut";
import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { SubjectPassRateChart } from "@/components/charts/SubjectPassRateChart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const subdomain = await getCurrentSubdomain();

  // TODO: fetch real stats from getTenantDb(schoolNumber)
  const stats = {
    totalCandidates: 0,
    universityQualifiersPct: 0,
    overallPassRatePct: 0,
    bestSubject: "—",
  };

  return (
    <div className="space-y-6 p-6">
      <TenantHeader subdomain={subdomain ?? "unknown"} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Candidates" value={stats.totalCandidates} />
        <StatCard
          title="University Qualifiers"
          value={`${stats.universityQualifiersPct}%`}
        />
        <StatCard
          title="Overall Pass Rate"
          value={`${stats.overallPassRatePct}%`}
        />
        <StatCard title="Best Subject" value={stats.bestSubject} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-semibold">University Qualification</h2>
          <QualificationDonut qualifies={0} doesNotQualify={0} />
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-semibold">Grade Distribution (Core Subjects)</h2>
          <GradeDistributionChart data={[]} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-semibold">Subject Pass Rates</h2>
        <SubjectPassRateChart data={[]} />
      </div>
    </div>
  );
}
