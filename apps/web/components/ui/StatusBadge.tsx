import type { CandidateStatus } from "@/lib/mock-data";

const CONFIG: Record<CandidateStatus, { bg: string; text: string; label: string; icon: string }> = {
  qualify:      { bg: "#E6F4EC", text: "#1A6B47", label: "Qualifies",    icon: "✓" },
  borderline:   { bg: "#FEF3E2", text: "#C07818", label: "Borderline",   icon: "◑" },
  "no-qualify": { bg: "#FDECEC", text: "#B83232", label: "No Qualify",   icon: "✕" },
};

interface Props {
  status: CandidateStatus;
}

export function StatusBadge({ status }: Props) {
  const cfg = CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.text,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: 10 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
