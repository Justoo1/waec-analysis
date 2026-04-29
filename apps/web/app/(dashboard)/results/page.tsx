"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CandidatePanel } from "@/components/CandidatePanel";
import type { Candidate } from "@/lib/mock-data";

const TH_STYLE: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left",
  fontSize: 11, fontWeight: 600, color: "#6B6860",
  textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
};

interface ApiCandidate {
  id: number;
  indexNumber: string;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  programme: string | null;
  status: string;
  totalPasses: number | null;
  bestSixAggregate: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Convert API candidate to the shape CandidatePanel expects
function toCandidateShape(c: ApiCandidate): Candidate {
  return {
    index: c.indexNumber,
    name: c.fullName ?? "",
    gender: (c.gender as "F" | "M") ?? "F",
    dob: c.dateOfBirth ?? "",
    status: (c.status as Candidate["status"]) ?? "no-qualify",
    passes: c.totalPasses ?? 0,
    total: 8,
    agg: c.bestSixAggregate,
    programme: c.programme ?? "",
    results: [],
  };
}

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progFilter, setProgFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (progFilter !== "all") params.set("programme", progFilter);
    if (yearParam) params.set("year", yearParam);

    try {
      const resp = await fetch(`/api/candidates?${params}`);
      if (!resp.ok) return;
      const data = await resp.json();
      setCandidates(data.candidates ?? []);
      setPagination(data.pagination ?? null);
      // Collect unique programmes from first load
      if (programmes.length === 0 && data.candidates?.length) {
        const progs = [...new Set<string>(
          data.candidates.map((c: ApiCandidate) => c.programme ?? "")
        )].filter(Boolean).sort();
        setProgrammes(progs);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, progFilter, page, yearParam]);

  // Reset to page 1 when year filter changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [yearParam]);

  useEffect(() => {
    const timeout = setTimeout(fetchCandidates, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchCandidates, search]);

  // Fetch all programme options once on mount
  useEffect(() => {
    fetch("/api/candidates?limit=1")
      .then((r) => r.json())
      .catch(() => {});
  }, []);

  async function handleExportCsv() {
    setExporting(true);
    try {
      const resp = await fetch("/api/candidates?limit=10000");
      if (!resp.ok) return;
      const data = await resp.json();
      const rows: ApiCandidate[] = data.candidates ?? [];
      const header = ["Index Number", "Full Name", "Gender", "Date of Birth", "Programme", "Status", "Total Passes", "Best-Six Aggregate"];
      const lines = [
        header.join(","),
        ...rows.map((c) => [
          c.indexNumber,
          `"${(c.fullName ?? "").replace(/"/g, '""')}"`,
          c.gender === "F" ? "Female" : "Male",
          c.dateOfBirth ?? "",
          `"${(c.programme ?? "").replace(/"/g, '""')}"`,
          c.status,
          c.totalPasses ?? "",
          c.bestSixAggregate ?? "",
        ].join(",")),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidates.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const total = pagination?.total ?? 0;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>Candidates</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            {total > 0 ? `${total.toLocaleString()} total candidates` : "Loading…"}
          </div>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || candidates.length === 0}
          className="no-print"
          style={{
            padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: "#fff", border: "1px solid #E2E0D8", cursor: "pointer",
            color: "#0D1F17", display: "flex", alignItems: "center", gap: 6,
            opacity: exporting || candidates.length === 0 ? 0.5 : 1,
          }}
        >
          ↓ {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6B6860", fontSize: 14 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or index number…"
            style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Status</option>
          <option value="qualify">Qualifies</option>
          <option value="borderline">Borderline</option>
          <option value="no-qualify">No Qualify</option>
        </select>
        <select
          value={progFilter}
          onChange={(e) => { setProgFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Programmes</option>
          {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6B6860", fontSize: 13 }}>Loading candidates…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAF8", borderBottom: "2px solid #E2E0D8" }}>
                {["Index", "Name", "Gender", "DOB", "Programme", "Status", "Passes", "Agg"].map((h) => (
                  <th key={h} style={TH_STYLE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => { setSelected(toCandidateShape(c)); setSelectedId(c.id); }}
                  style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", cursor: "pointer", borderBottom: "1px solid #E2E0D8" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF6F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8")}
                >
                  <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B6860" }}>{c.indexNumber}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>{c.fullName}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860" }}>{c.gender === "F" ? "Female" : "Male"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860", fontFamily: "'JetBrains Mono', monospace" }}>{c.dateOfBirth ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860" }}>{c.programme}</td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={c.status as "qualify" | "borderline" | "no-qualify"} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#0D1F17", textAlign: "center" }}>{c.totalPasses ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#0D1F17", textAlign: "center" }}>{c.bestSixAggregate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && candidates.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "#6B6860" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>⌕</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No candidates found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try a different name or index number</div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E0D8", fontSize: 12, color: "#6B6860", display: "flex", gap: 8, alignItems: "center" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #E2E0D8", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
            >
              ←
            </button>
            <span>Page {page} of {pagination.pages} · {total.toLocaleString()} candidates</span>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #E2E0D8", background: "#fff", cursor: page >= pagination.pages ? "not-allowed" : "pointer", opacity: page >= pagination.pages ? 0.4 : 1 }}
            >
              →
            </button>
          </div>
        )}
        {!pagination?.pages || pagination.pages <= 1 ? (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E0D8", fontSize: 12, color: "#6B6860" }}>
            {loading ? "" : `Showing ${candidates.length} candidates — click any row to view full results`}
          </div>
        ) : null}
      </div>

      {selected && <CandidatePanel candidate={selected} candidateId={selectedId} onClose={() => { setSelected(null); setSelectedId(undefined); }} />}
    </div>
  );
}
