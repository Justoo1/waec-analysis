"use client";

import { useEffect, useState } from "react";

interface Segment {
  value: number;
  color: string;
  label?: string;
  sub?: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  thickness?: number;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function DonutChart({ segments, size = 220, thickness = 42 }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2 - 4;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const paths = segments.map((seg, i) => {
    const pct = animated ? seg.value / total : 0;
    const startDeg = animated
      ? (segments.slice(0, i).reduce((s, g) => s + g.value, 0) / total) * 358
      : 0;
    const endDeg = startDeg + pct * 358;
    const s = polarToXY(cx, cy, r, startDeg);
    const e = polarToXY(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const d = `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeLinecap="butt"
        style={{ transition: "all 0.5s ease-out" }}
      />
    );
  });

  const main = segments[0];
  return (
    <svg width={size} height={size} aria-label="Donut chart">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E0D8" strokeWidth={thickness} />
      {paths}
      {main?.label && (
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize="30"
          fontWeight="600"
          fill="#0D1F17"
          fontFamily="'Lora', serif"
        >
          {main.label}
        </text>
      )}
      {main?.sub && (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="12"
          fill="#6B6860"
          fontFamily="'DM Sans', sans-serif"
        >
          {main.sub}
        </text>
      )}
    </svg>
  );
}
