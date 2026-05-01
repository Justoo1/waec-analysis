"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/",           icon: "▤",  label: "Overview" },
  { href: "/results",    icon: "◉",  label: "Candidates" },
  { href: "/subjects",   icon: "◈",  label: "Subject Analysis" },
  { href: "/university", icon: "◎",  label: "University Qualification" },
  { href: "/compare",    icon: "▥",  label: "Year Comparison" },
  { href: "/upload",     icon: "⬆",  label: "Upload Results" },
];

interface Props {
  userEmail: string;
  schoolName: string;
  schoolNumber: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userEmail, schoolName, schoolNumber, isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = parseInt(searchParams.get("year") ?? "") || null;
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/sittings")
      .then((r) => r.json())
      .then((data) => {
        const ys: number[] = (data.sittings ?? [])
          .map((s: { year: number }) => s.year)
          .sort((a: number, b: number) => b - a);
        setYears(ys);
      })
      .catch(() => {});
  }, []);

  function handleYearChange(y: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Build a nav href that preserves the current year param
  function navHref(href: string) {
    if (!currentYear) return href;
    return `${href}?year=${currentYear}`;
  }

  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <aside className={`dashboard-sidebar${isOpen ? " open" : ""}`}>
      {/* Logo */}
      <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/icon.svg" alt="" width={28} height={28} style={{ borderRadius: 6, flexShrink: 0 }} />
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", fontFamily: "'Lora', serif", flex: 1 }}>
          WASSCE Analytics
        </span>
        {/* Close button — visible only on mobile via CSS */}
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", padding: "4px", alignItems: "center",
            flexShrink: 0, lineHeight: 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* School info */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1A6B47", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 18, color: "#fff" }}>
          ✦
        </div>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.35, fontFamily: "'Lora', serif" }}>
          {schoolName || "—"}
        </div>
        {schoolNumber && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>
            Code: {schoolNumber}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={navHref(item.href)}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 6, marginBottom: 2,
                background: active ? "rgba(26,107,71,0.18)" : "transparent",
                borderLeft: active ? "3px solid #1A6B47" : "3px solid transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                fontWeight: active ? 500 : 400, fontSize: 13,
                cursor: "pointer", textDecoration: "none", transition: "all 0.15s",
              }}
            >
              <span style={{ color: active ? "#1A6B47" : "rgba(255,255,255,0.3)", fontSize: 14, width: 18, textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "8px 0" }} />

        <Link
          href={navHref("/settings")}
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 10px", borderRadius: 6,
            color: pathname === "/settings" ? "#fff" : "rgba(255,255,255,0.5)",
            fontSize: 13, textDecoration: "none", borderLeft: "3px solid transparent",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, width: 18, textAlign: "center" }}>⚙</span>
          Settings
        </Link>
      </nav>

      {/* Year + User */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
            Exam Year
          </label>
          {years.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "5px 0" }}>No data uploaded</div>
          ) : (
            <select
              value={currentYear ?? years[0]}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5,
                padding: "5px 10px", fontSize: 13, width: "100%", cursor: "pointer",
              }}
            >
              {years.map((y) => (
                <option key={y} value={y} style={{ background: "#0D1F17" }}>
                  WASSCE {y}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A6B47", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Head Admin</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 16, padding: "4px", flexShrink: 0, lineHeight: 1 }}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
