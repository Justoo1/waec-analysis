"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SchoolSheet, type SchoolRow } from "./_components/SchoolSheet";

const GHANA_REGIONS = [
  "Greater Accra","Ashanti","Western","Eastern","Central","Northern",
  "Upper East","Upper West","Volta","Brong-Ahafo","Oti","Bono",
  "Bono East","Ahafo","Western North","North East","Savannah",
];

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SchoolRow | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/schools")
      .then((r) => r.json())
      .then((data) => { setSchools(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return schools.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.schoolNumber.includes(q) && !s.subdomain.includes(q)) return false;
      if (planFilter !== "all" && s.plan !== planFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      if (regionFilter !== "all" && s.region !== regionFilter) return false;
      return true;
    });
  }, [schools, search, planFilter, statusFilter, regionFilter]);

  const handleUpdated = (updated: SchoolRow) => {
    setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  };

  const handleDeleted = (id: number) => {
    setSchools((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
  };

  const selectStyle: React.CSSProperties = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "7px 10px",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 600, margin: 0 }}>Schools</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            {loading ? "Loading…" : `${filtered.length} of ${schools.length} school${schools.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/schools/new"
          style={{ background: "#3b82f6", color: "#fff", padding: "8px 18px", borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
        >
          + Register school
        </Link>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, number, subdomain…"
          style={{
            flex: "1 1 220px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 6,
            padding: "7px 12px",
            color: "#f1f5f9",
            fontSize: 13,
            outline: "none",
          }}
        />
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={selectStyle}>
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={selectStyle}>
          <option value="all">All regions</option>
          {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(search || planFilter !== "all" || statusFilter !== "all" || regionFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); setRegionFilter("all"); }}
            style={{ background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "7px 12px", color: "#64748b", fontSize: 13, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "60px 0" }}>Loading schools…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#1e293b", border: "1px dashed #334155", borderRadius: 8, padding: "60px 24px", textAlign: "center", color: "#475569" }}>
          {schools.length === 0 ? (
            <>No schools registered yet.{" "}<Link href="/admin/schools/new" style={{ color: "#3b82f6" }}>Register the first one →</Link></>
          ) : (
            "No schools match the current filters."
          )}
        </div>
      ) : (
        <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                {["School", "Number", "Subdomain", "Region", "Plan", "Users", "Status", "Registered"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((school, i) => (
                <tr
                  key={school.id}
                  onClick={() => setSelected(school)}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid #0f172a" : "none",
                    cursor: "pointer",
                    background: selected?.id === school.id ? "#0f2744" : "transparent",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(e) => { if (selected?.id !== school.id) (e.currentTarget as HTMLElement).style.background = "#0f172a"; }}
                  onMouseLeave={(e) => { if (selected?.id !== school.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 16px", color: "#f1f5f9", fontWeight: 500 }}>{school.name}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{school.schoolNumber}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{school.subdomain}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{school.region ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><PlanBadge plan={school.plan ?? "free"} /></td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{school.userCount}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: school.isActive ? "#4ade80" : "#f87171", fontSize: 12 }}>
                      {school.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                    {school.createdAt ? new Date(school.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Side sheet */}
      {selected && (
        <SchoolSheet
          school={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    free: { bg: "#0f172a", text: "#64748b" },
    basic: { bg: "#1e3a5f", text: "#60a5fa" },
    pro: { bg: "#1a2e1a", text: "#4ade80" },
  };
  const c = colors[plan] ?? colors.free;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {plan}
    </span>
  );
}
