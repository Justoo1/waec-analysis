import { GRADE_COLORS } from "@/lib/mock-data";

interface Props {
  grade: string;
}

export function GradeBadge({ grade }: Props) {
  const gc = GRADE_COLORS[grade] ?? { bg: "#E2E0D8", text: "#333", label: "" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background: gc.bg,
        color: gc.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        lineHeight: "18px",
      }}
    >
      {grade}
    </span>
  );
}
