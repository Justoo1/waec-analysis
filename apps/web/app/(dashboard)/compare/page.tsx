import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YearOverYearChart } from "@/components/charts/YearOverYearChart";

export default async function ComparePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // TODO: fetch multi-year data from getTenantDb(schoolNumber)
  const hasMultipleYears = false;

  if (!hasMultipleYears) {
    return (
      <div className="flex h-96 items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Year-over-Year Comparison</h1>
          <p className="text-sm text-muted-foreground">
            Upload results for at least two years to enable comparisons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Year-over-Year Comparison</h1>
      <YearOverYearChart data={[]} />
    </div>
  );
}
