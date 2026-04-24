export default function ComparePage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            Year Comparison
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>WASSCE year-over-year performance</div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 60, textAlign: "center", color: "#6B6860", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>▥</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "#0D1F17" }}>Coming soon</div>
        <div style={{ fontSize: 13 }}>Upload results for at least two years to enable year-over-year comparison</div>
      </div>
    </div>
  );
}
