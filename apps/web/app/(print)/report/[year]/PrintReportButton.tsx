"use client";

export function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500,
        background: "#1A6B47", border: "none", color: "#fff", cursor: "pointer",
      }}
    >
      Print / Save PDF
    </button>
  );
}
