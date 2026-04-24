"use client";

import { useEffect, useState } from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, subColor, accent = "#1A6B47" }: Props) {
  const [displayed, setDisplayed] = useState<string | number>(0);

  useEffect(() => {
    const num = parseFloat(String(value));
    if (isNaN(num)) {
      setDisplayed(value);
      return;
    }
    let start = 0;
    const dur = 700;
    const step = 16;
    const inc = num / (dur / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= num) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        const strVal = String(value);
        setDisplayed(strVal.includes(".") ? start.toFixed(1) : Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        padding: "20px 20px 18px",
        borderLeft: `4px solid ${accent}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11, fontWeight: 500, color: "#6B6860",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32, fontWeight: 600, color: "#0D1F17",
          fontFamily: "'Lora', serif", lineHeight: 1.1,
        }}
      >
        {displayed}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: subColor ?? "#6B6860", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
