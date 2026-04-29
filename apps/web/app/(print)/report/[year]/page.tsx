import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { desc, eq, sql, count } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant";
import { PrintTrigger } from "../../results/[id]/print/PrintTrigger";
import { PrintReportButton } from "./PrintReportButton";
import "../print-landscape.css";

export default async function SchoolReportPrintPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.schoolNumber) redirect("/login");

  const { year: yearParam } = await params;
  const year = yearParam === "all" ? null : parseInt(yearParam);
  if (yearParam !== "all" && (!year || isNaN(year))) redirect("/subjects");

  const { db: tdb, schema: s, close } = await getTenantDb(session.user.schoolNumber);

  type SubjectStat = {
    name: string;
    cands: number;
    A1: number; B2: number; B3: number; C4: number; C5: number; C6: number;
    D7: number; E8: number; F9: number;
    passes: number;
  };

  let subjects: SubjectStat[] = [];

  try {
    const { results: r, candidates: c, examSittings: es } = s;

    let sittingId: number | null = null;
    if (year) {
      const [sitting] = await tdb.select({ id: es.id }).from(es).where(eq(es.year, year)).limit(1);
      sittingId = sitting?.id ?? null;
    }

    const cols = {
      subject: r.subject,
      total: count(),
      A1: sql<string>`SUM(CASE WHEN ${r.grade} = 'A1' THEN 1 ELSE 0 END)`,
      B2: sql<string>`SUM(CASE WHEN ${r.grade} = 'B2' THEN 1 ELSE 0 END)`,
      B3: sql<string>`SUM(CASE WHEN ${r.grade} = 'B3' THEN 1 ELSE 0 END)`,
      C4: sql<string>`SUM(CASE WHEN ${r.grade} = 'C4' THEN 1 ELSE 0 END)`,
      C5: sql<string>`SUM(CASE WHEN ${r.grade} = 'C5' THEN 1 ELSE 0 END)`,
      C6: sql<string>`SUM(CASE WHEN ${r.grade} = 'C6' THEN 1 ELSE 0 END)`,
      D7: sql<string>`SUM(CASE WHEN ${r.grade} = 'D7' THEN 1 ELSE 0 END)`,
      E8: sql<string>`SUM(CASE WHEN ${r.grade} = 'E8' THEN 1 ELSE 0 END)`,
      F9: sql<string>`SUM(CASE WHEN ${r.grade} = 'F9' THEN 1 ELSE 0 END)`,
      passes: sql<string>`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)`,
    };

    const orderExpr = desc(
      sql`SUM(CASE WHEN ${r.grade} IN ('A1','B2','B3','C4','C5','C6') THEN 1 ELSE 0 END)::float / COUNT(*)`
    );

    const rows = await (sittingId
      ? tdb.select(cols).from(r)
          .innerJoin(c, eq(r.candidateId, c.id))
          .where(eq(c.sittingId, sittingId))
          .groupBy(r.subject).orderBy(orderExpr)
      : tdb.select(cols).from(r)
          .groupBy(r.subject).orderBy(orderExpr));

    subjects = rows.map((row) => ({
      name: row.subject,
      cands: parseInt(String(row.total)),
      A1: parseInt(row.A1), B2: parseInt(row.B2), B3: parseInt(row.B3),
      C4: parseInt(row.C4), C5: parseInt(row.C5), C6: parseInt(row.C6),
      D7: parseInt(row.D7), E8: parseInt(row.E8), F9: parseInt(row.F9),
      passes: parseInt(row.passes),
    }));
  } catch {
    // schema not yet provisioned — render empty table
  } finally {
    await close();
  }

  const yearLabel = year ? String(year) : "All Years";
  const printedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const thBase: React.CSSProperties = {
    border: "1px solid #999",
    padding: "5px 6px",
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    background: "#E8E8E8",
    whiteSpace: "nowrap",
  };

  const tdBase: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "4px 6px",
    fontSize: 9,
    textAlign: "center",
  };

  return (
    <>
      <PrintTrigger />

      <style>{`
        @media print { .no-print { display: none !important; } }
        body { margin: 0; }
      `}</style>

      <div style={{ padding: "20px 24px", fontFamily: "Arial, Helvetica, sans-serif", maxWidth: "100%" }}>

        {/* School header */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#0D1F17" }}>
            {session.user.schoolName ?? "—"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, color: "#0D1F17" }}>
            {yearLabel} WASSCE RESULTS ANALYSIS
          </div>
          <div style={{ fontSize: 9, color: "#6B6860", marginTop: 2 }}>
            School Code: {session.user.schoolNumber} &nbsp;·&nbsp; Printed: {printedOn}
          </div>
        </div>

        {/* Results table */}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "7%" }} />
            {/* 9 grade columns */}
            {Array.from({ length: 9 }).map((_, i) => (
              <col key={i} style={{ width: "5%" }} />
            ))}
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>

          <thead>
            {/* Row 1 */}
            <tr>
              <th rowSpan={2} style={{ ...thBase, textAlign: "left", paddingLeft: 8 }}>SUBJECT</th>
              <th rowSpan={2} style={thBase}>CANDI-<br />DATES<br />(TOTAL)</th>
              <th colSpan={9} style={thBase}>GRADES</th>
              <th rowSpan={2} style={{ ...thBase, color: "#B83232" }}>%FAIL</th>
              <th rowSpan={2} style={{ ...thBase, color: "#1A6B47" }}>
                % PASS<br />(A1–C6)<br />{yearLabel}
              </th>
            </tr>
            {/* Row 2 — individual grade headers */}
            <tr>
              {(["A1","B2","B3","C4","C5","C6","D7","E8","F9"] as const).map((g) => (
                <th key={g} style={{
                  ...thBase,
                  color: ["A1","B2","B3"].includes(g)
                    ? "#1A6B47"
                    : ["C4","C5","C6"].includes(g)
                    ? "#2E7D7A"
                    : ["D7"].includes(g)
                    ? "#C07818"
                    : "#B83232",
                }}>
                  {g}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ ...tdBase, padding: 20, color: "#6B6860", fontStyle: "italic" }}>
                  No data available.
                </td>
              </tr>
            ) : (
              subjects.map((subj, i) => {
                const failCount = subj.D7 + subj.E8 + subj.F9;
                const failPct = subj.cands > 0
                  ? ((failCount / subj.cands) * 100).toFixed(1)
                  : "0.0";
                const passPct = subj.cands > 0
                  ? ((subj.passes / subj.cands) * 100).toFixed(1)
                  : "0.0";
                const passNum = parseFloat(passPct);

                return (
                  <tr key={subj.name} style={{ background: i % 2 === 0 ? "#fff" : "#F5F5F3" }}>
                    <td style={{ ...tdBase, textAlign: "left", paddingLeft: 8, fontWeight: 500 }}>
                      {subj.name}
                    </td>
                    <td style={tdBase}>{subj.cands}</td>
                    <td style={{ ...tdBase, background: subj.A1 > 0 ? "#E6F4EC" : undefined }}>{subj.A1 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.B2 > 0 ? "#E6F4EC" : undefined }}>{subj.B2 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.B3 > 0 ? "#E6F4EC" : undefined }}>{subj.B3 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.C4 > 0 ? "#EAF4F4" : undefined }}>{subj.C4 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.C5 > 0 ? "#EAF4F4" : undefined }}>{subj.C5 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.C6 > 0 ? "#EAF4F4" : undefined }}>{subj.C6 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.D7 > 0 ? "#FEF3E2" : undefined }}>{subj.D7 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.E8 > 0 ? "#FDECEC" : undefined }}>{subj.E8 || "—"}</td>
                    <td style={{ ...tdBase, background: subj.F9 > 0 ? "#FDECEC" : undefined }}>{subj.F9 || "—"}</td>
                    <td style={{ ...tdBase, fontWeight: 600, color: "#B83232" }}>{failPct}%</td>
                    <td style={{
                      ...tdBase,
                      fontWeight: 700,
                      color: passNum >= 90 ? "#1A6B47" : passNum >= 75 ? "#2E7D7A" : passNum >= 50 ? "#C07818" : "#B83232",
                    }}>
                      {passPct}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 8, color: "#9E9B94", borderTop: "1px solid #E2E0D8", paddingTop: 6 }}>
          <span>Generated by WASSCE Analytics</span>
          <span>{session.user.schoolName} · {yearLabel} WASSCE</span>
        </div>
      </div>

      {/* Browser-only back button */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div
        className="no-print"
        style={{ position: "fixed", bottom: 24, right: 24, display: "flex", gap: 10 }}
      >
        <a
          href={`/subjects${year ? `?year=${year}` : ""}`}
          style={{
            padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: "#fff", border: "1px solid #E2E0D8", color: "#0D1F17",
            textDecoration: "none",
          }}
        >
          ← Back
        </a>
        <PrintReportButton />
      </div>
    </>
  );
}
