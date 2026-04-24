"use client";

import { useEffect, useState } from "react";

interface Props {
  label: string;
  value: number;
  max?: number;
  color?: string;
  target?: number;
  warn?: boolean;
}

export function HorizontalBar({ label, value, max = 100, color, target, warn }: Props) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 80);
    return () => clearTimeout(t);
  }, [value]);

  const pct = (w / max) * 100;
  const targetPct = target ? (target / max) * 100 : 0;
  const belowTarget = target !== undefined && value < target;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
      <div style={{ width: 170, fontSize: 12, color: "#0D1F17", textAlign: "right", flexShrink: 0, fontWeight: 400 }}>
        {label}
      </div>
      <div style={{ flex: 1, position: "relative", height: 20 }}>
        <div style={{ position: "absolute", inset: 0, background: "#F0EDE6", borderRadius: 3 }} />
        <div
          style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${pct}%`, borderRadius: 3,
            background: color ?? "#1A6B47",
            transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        {target && (
          <div
            style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${targetPct}%`, width: 2,
              background: "#C07818", borderRadius: 1,
            }}
          />
        )}
      </div>
      <div
        style={{
          width: 52, fontSize: 12, fontWeight: 600, flexShrink: 0,
          color: belowTarget ? "#C07818" : "#1A6B47",
        }}
      >
        {value.toFixed(1)}%{warn && belowTarget ? " ⚠" : ""}
      </div>
    </div>
  );
}
