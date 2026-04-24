"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/",           icon: "▤",  label: "Overview" },
  { href: "/results",    icon: "◉",  label: "Candidates" },
  { href: "/subjects",   icon: "◈",  label: "Subject Analysis" },
  { href: "/university", icon: "◎",  label: "University Qualification" },
  { href: "/compare",    icon: "▥",  label: "Year Comparison" },
  { href: "/upload",     icon: "⬆",  label: "Upload Results" },
];

const YEARS = [2025, 2024, 2023];

interface Props {
  userEmail: string;
}

export function Sidebar({ userEmail }: Props) {
  const pathname = usePathname();
  const [year, setYear] = useState(2025);

  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "#0D1F17",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* School info */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#1A6B47",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 10, fontSize: 18, color: "#fff",
          }}
        >
          ✦
        </div>
        <div
          style={{
            color: "#fff", fontSize: 13, fontWeight: 600,
            lineHeight: 1.35, fontFamily: "'Lora', serif",
          }}
        >
          Archbishop Porter<br />Girls&apos; SHS
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>
          Code: 0040103
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 6,
                marginBottom: 2,
                background: active ? "rgba(26,107,71,0.18)" : "transparent",
                borderLeft: active ? "3px solid #1A6B47" : "3px solid transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                fontWeight: active ? 500 : 400,
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  color: active ? "#1A6B47" : "rgba(255,255,255,0.3)",
                  fontSize: 14,
                  width: 18,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "8px 0" }} />

        <Link
          href="/settings"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "9px 10px", borderRadius: 6,
            color: "rgba(255,255,255,0.5)", fontSize: 13,
            textDecoration: "none",
            borderLeft: "3px solid transparent",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, width: 18, textAlign: "center" }}>⚙</span>
          Settings
        </Link>
      </nav>

      {/* Year + User */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              color: "rgba(255,255,255,0.4)", fontSize: 10,
              textTransform: "uppercase", letterSpacing: "0.08em",
              display: "block", marginBottom: 4,
            }}
          >
            Exam Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 5,
              padding: "5px 10px",
              fontSize: 13,
              width: "100%",
              cursor: "pointer",
            }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y} style={{ background: "#0D1F17" }}>
                WASSCE {y}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#1A6B47",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Head Admin
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
