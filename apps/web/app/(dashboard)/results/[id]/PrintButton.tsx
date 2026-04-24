"use client";

interface Props {
  candidateId: number;
}

export function PrintButton({ candidateId }: Props) {
  return (
    <button
      onClick={() => window.open(`/results/${candidateId}/print`, "_blank")}
      style={{
        padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500,
        background: "#fff", border: "1px solid #E2E0D8", cursor: "pointer", color: "#0D1F17",
        display: "flex", alignItems: "center", gap: 6,
      }}
    >
      ⊞ Print
    </button>
  );
}
