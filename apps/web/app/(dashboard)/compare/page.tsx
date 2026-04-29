"use client";

import { useEffect, useState } from "react";
import { YearOverYearChart } from "@/components/charts/YearOverYearChart";

interface Sitting {
  id: number;
  year: number;
  totalCandidates: number | null;
}

interface YearSummary {
  totalCandidates: number;
  passRate: number;
  uniQualifiers: number;
}

type SubjectRow = { subject: string; [year: string]: number | string };

type SortKey = "subject" | "delta" | string;

function delta(row: SubjectRow, years: string[]): number {
  if (years.length < 2) return 0;
  const last = Number(row[years[years.length - 1]] ?? 0);
  const prev = Number(row[years[years.length - 2]] ?? 0);
  return last - prev;
}

function DeltaBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.05)
    return <span style={{ color: "#6B6860", fontSize: 12 }}>—</span>;
  const up = value > 0;
  return (
    <span style={{ color: up ? "#1A6B47" : "#B83232", fontSize: 12, fontWeight: 600 }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}pp
    </span>
  );
}

function SummaryCard({
  label,
  years,
  summary,
  field,
  format,
}: {
  label: string;
  years: string[];
  summary: Record<string, YearSummary>;
  field: keyof YearSummary;
  format: (v: number) => string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: 8,
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, color: "#6B6860", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {years.map((yr, i) => {
          const val = summary[yr]?.[field] ?? 0;
          const prevVal = i > 0 ? (summary[years[i - 1]]?.[field] ?? 0) : null;
          const diff = prevVal !== null ? (val as number) - (prevVal as number) : null;
          return (
            <div key={yr} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#6B6860", width: 44, flexShrink: 0 }}>{yr}</span>
              <span
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#0D1F17",
                  letterSpacing: "-0.02em",
                }}
              >
                {format(val as number)}
              </span>
              {diff !== null && Math.abs(diff) >= 0.05 && (
                <span style={{ fontSize: 11, color: diff > 0 ? "#1A6B47" : "#B83232", fontWeight: 600 }}>
                  {diff > 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(field === "passRate" ? 1 : 0)}
                  {field === "passRate" ? "pp" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [chartData, setChartData] = useState<SubjectRow[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [summary, setSummary] = useState<Record<string, YearSummary>>({});
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/sittings")
      .then((r) => r.json())
      .then((d) => {
        setSittings(d.sittings ?? []);
        const recent = (d.sittings ?? []).slice(0, 2).map((s: Sitting) => String(s.year));
        setSelectedYears(recent);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedYears.length < 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/compare?years=${selectedYears.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setChartData(d.data ?? []);
        setYears(d.years ?? []);
        setSummary(d.summary ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYears]);

  function toggleYear(year: string) {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "delta" ? "desc" : "asc");
    }
  }

  const sortedData = [...chartData].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === "delta") {
      av = delta(a, years);
      bv = delta(b, years);
    } else if (sortKey === "subject") {
      return sortDir === "asc"
        ? String(a.subject).localeCompare(String(b.subject))
        : String(b.subject).localeCompare(String(a.subject));
    } else {
      av = Number(a[sortKey] ?? 0);
      bv = Number(b[sortKey] ?? 0);
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: "#6B6860",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    textAlign: key === "subject" ? "left" : "right",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #E2E0D8",
    background: sortKey === key ? "#F7F6F2" : "transparent",
  });

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: "1px solid #E2E0D8",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 26,
              fontWeight: 500,
              color: "#0D1F17",
              margin: 0,
            }}
          >
            Year Comparison
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            WASSCE year-over-year performance
          </div>
        </div>
      </div>

      {sittings.length < 2 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 60,
            textAlign: "center",
            color: "#6B6860",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>▥</div>
          <div
            style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "#0D1F17" }}
          >
            {sittings.length === 0 ? "No data uploaded yet" : "Need at least two years"}
          </div>
          <div style={{ fontSize: 13 }}>
            Upload results for at least two years to enable year-over-year comparison
          </div>
        </div>
      ) : (
        <>
          {/* Year selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {sittings.map((s) => {
              const active = selectedYears.includes(String(s.year));
              return (
                <button
                  key={s.id}
                  onClick={() => toggleYear(String(s.year))}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: active ? "#1A6B47" : "#fff",
                    color: active ? "#fff" : "#0D1F17",
                    border: `1px solid ${active ? "#1A6B47" : "#E2E0D8"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {s.year}
                  {s.totalCandidates != null && (
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                      ({s.totalCandidates})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedYears.length < 2 && (
            <div
              style={{
                background: "#FEF3E2",
                borderRadius: 6,
                padding: "10px 16px",
                fontSize: 13,
                color: "#C07818",
                marginBottom: 20,
              }}
            >
              Select at least 2 years to compare
            </div>
          )}

          {loading && (
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: 48,
                textAlign: "center",
                color: "#6B6860",
                fontSize: 13,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              Loading comparison data…
            </div>
          )}

          {!loading && years.length >= 2 && (
            <>
              {/* Summary KPI row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <SummaryCard
                  label="Total Candidates"
                  years={years}
                  summary={summary}
                  field="totalCandidates"
                  format={(v) => v.toLocaleString()}
                />
                <SummaryCard
                  label="Overall Pass Rate"
                  years={years}
                  summary={summary}
                  field="passRate"
                  format={(v) => `${v.toFixed(1)}%`}
                />
                <SummaryCard
                  label="University Qualifiers"
                  years={years}
                  summary={summary}
                  field="uniQualifiers"
                  format={(v) => v.toLocaleString()}
                />
              </div>

              {chartData.length > 0 ? (
                <>
                  {/* Chart */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "20px 24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#0D1F17",
                        marginBottom: 20,
                      }}
                    >
                      Subject Pass Rate — {years.join(" vs ")}
                    </div>
                    <YearOverYearChart data={chartData} years={years} />
                  </div>

                  {/* Comparison table */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #E2E0D8",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#0D1F17",
                      }}
                    >
                      Subject Breakdown
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={thStyle("subject")} onClick={() => handleSort("subject")}>
                              Subject{sortIndicator("subject")}
                            </th>
                            {years.map((yr) => (
                              <th
                                key={yr}
                                style={thStyle(yr)}
                                onClick={() => handleSort(yr)}
                              >
                                {yr}{sortIndicator(yr)}
                              </th>
                            ))}
                            <th style={thStyle("delta")} onClick={() => handleSort("delta")}>
                              Change{sortIndicator("delta")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedData.map((row, i) => {
                            const d = delta(row, years);
                            return (
                              <tr
                                key={String(row.subject)}
                                style={{
                                  background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                                  borderBottom: "1px solid #F0EEE8",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "10px 14px",
                                    fontSize: 13,
                                    color: "#0D1F17",
                                    fontWeight: 500,
                                  }}
                                >
                                  {row.subject}
                                </td>
                                {years.map((yr) => (
                                  <td
                                    key={yr}
                                    style={{
                                      padding: "10px 14px",
                                      fontSize: 13,
                                      color: "#0D1F17",
                                      textAlign: "right",
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {row[yr] != null ? `${row[yr]}%` : "—"}
                                  </td>
                                ))}
                                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                  <DeltaBadge value={d} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 48,
                    textAlign: "center",
                    color: "#6B6860",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  No shared subjects found between the selected years.
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
