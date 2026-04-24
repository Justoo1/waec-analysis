"use client";

import { useEffect, useState } from "react";
import { YearOverYearChart } from "@/components/charts/YearOverYearChart";

interface Sitting {
  id: number;
  year: number;
  totalCandidates: number | null;
}

export default function ComparePage() {
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [chartData, setChartData] = useState<object[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/sittings")
      .then((r) => r.json())
      .then((d) => {
        setSittings(d.sittings ?? []);
        // Auto-select the two most recent years
        const recent = (d.sittings ?? []).slice(0, 2).map((s: Sitting) => String(s.year));
        setSelectedYears(recent);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedYears.length < 2) {
      setChartData([]);
      return;
    }
    setLoading(true);
    fetch(`/api/compare?years=${selectedYears.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setChartData(d.data ?? []);
        setYears(d.years ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYears]);

  function toggleYear(year: string) {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>Year Comparison</h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>WASSCE year-over-year performance</div>
        </div>
      </div>

      {sittings.length < 2 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 60, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>▥</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "#0D1F17" }}>
            {sittings.length === 0 ? "No data uploaded yet" : "Need at least two years"}
          </div>
          <div style={{ fontSize: 13 }}>Upload results for at least two years to enable year-over-year comparison</div>
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
                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    background: active ? "#1A6B47" : "#fff",
                    color: active ? "#fff" : "#0D1F17",
                    border: `1px solid ${active ? "#1A6B47" : "#E2E0D8"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {s.year}
                  {s.totalCandidates != null && (
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({s.totalCandidates})</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedYears.length < 2 && (
            <div style={{ background: "#FEF3E2", borderRadius: 6, padding: "10px 16px", fontSize: 13, color: "#C07818", marginBottom: 20 }}>
              Select at least 2 years to compare
            </div>
          )}

          {loading && (
            <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center", color: "#6B6860", fontSize: 13, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              Loading comparison data…
            </div>
          )}

          {!loading && chartData.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17", marginBottom: 16 }}>
                Subject Pass Rate — {years.join(" vs ")}
              </div>
              <YearOverYearChart data={chartData as Parameters<typeof YearOverYearChart>[0]["data"]} years={years} />
            </div>
          )}

          {!loading && selectedYears.length >= 2 && chartData.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              No shared subjects found between the selected years.
            </div>
          )}
        </>
      )}
    </div>
  );
}
