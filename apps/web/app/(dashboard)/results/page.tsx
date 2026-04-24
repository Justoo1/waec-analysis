"use client";

import { useState } from "react";
import { CANDIDATES, STATS } from "@/lib/mock-data";
import type { Candidate } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CandidatePanel } from "@/components/CandidatePanel";

const PROGRAMMES = [...new Set(CANDIDATES.map((c) => c.programme))].sort();

const TH_STYLE: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left",
  fontSize: 11, fontWeight: 600, color: "#6B6860",
  textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
};

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progFilter, setProgFilter] = useState("all");
  const [selected, setSelected] = useState<Candidate | null>(null);

  const filtered = CANDIDATES.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.index.includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchProg = progFilter === "all" || c.programme === progFilter;
    return matchSearch && matchStatus && matchProg;
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>Candidates</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>WASSCE 2025 · {STATS.totalCandidates} total candidates</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6B6860", fontSize: 14 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or index number…"
            style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Status</option>
          <option value="qualify">Qualifies</option>
          <option value="borderline">Borderline</option>
          <option value="no-qualify">No Qualify</option>
        </select>
        <select
          value={progFilter}
          onChange={(e) => setProgFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E2E0D8", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Programmes</option>
          {PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#0D1F17", border: "1px solid #E2E0D8", marginLeft: "auto" }}>
          ⬇ Export
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ background: "#EEF6F2", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "#1A6B47", marginBottom: 14, display: "flex", gap: 16 }}>
        <span>Showing <strong>{filtered.length}</strong> of {STATS.totalCandidates} candidates</span>
        <span>·</span>
        <span>✓ {STATS.qualifiers} qualify</span>
        <span>·</span>
        <span style={{ color: "#C07818" }}>◑ {STATS.borderline} borderline</span>
        <span>·</span>
        <span style={{ color: "#B83232" }}>✕ {STATS.noQualify} do not qualify</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAF8", borderBottom: "2px solid #E2E0D8" }}>
              {["Index", "Name", "Gender", "DOB", "Programme", "Status", "Passes", "Agg"].map((h) => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.index}
                onClick={() => setSelected(c)}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                  cursor: "pointer",
                  borderBottom: "1px solid #E2E0D8",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF6F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8")}
              >
                <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B6860" }}>{c.index}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>{c.name}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860" }}>{c.gender === "F" ? "Female" : "Male"}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860", fontFamily: "'JetBrains Mono', monospace" }}>{c.dob}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6860" }}>{c.programme}</td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#0D1F17", textAlign: "center" }}>{c.passes}/{c.total}</td>
                <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#0D1F17", textAlign: "center" }}>{c.agg ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "#6B6860" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>⌕</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No candidates found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try a different name or index number</div>
          </div>
        )}

        <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E0D8", fontSize: 12, color: "#6B6860" }}>
          Showing {filtered.length} candidates — click any row to view full results
        </div>
      </div>

      {selected && <CandidatePanel candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
