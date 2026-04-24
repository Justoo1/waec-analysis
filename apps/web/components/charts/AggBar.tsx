"use client";

import { useEffect, useState } from "react";
import type { AggPoint } from "@/lib/mock-data";

interface Props {
  data: AggPoint[];
}

export function AggBar({ data }: Props) {
  const max = Math.max(...data.map((d) => d.count));
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, padding: "0 4px" }}>
      {data.map((d, i) => {
        const h = animated ? (d.count / max) * 110 : 0;
        const color = d.agg <= 24 ? "#1A6B47" : d.agg <= 30 ? "#C07818" : "#B83232";
        return (
          <div
            key={i}
            title={`Agg ${d.agg}: ${d.count} candidates`}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div
              style={{
                width: "100%", height: h, background: color,
                borderRadius: "2px 2px 0 0",
                transition: `height ${0.3 + i * 0.01}s ease-out`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
