"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { Sidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  userEmail: string;
  schoolName: string;
  schoolNumber: string;
}

export function DashboardShell({ children, userEmail, schoolName, schoolNumber }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function openSidebar() { setSidebarOpen(true); }
  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className="dashboard-shell">
      {/* Mobile top bar — hidden on desktop via CSS */}
      <header className="mobile-topbar">
        <button
          onClick={openSidebar}
          aria-label="Open menu"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.85)",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/icon.svg" alt="" width={24} height={24} style={{ borderRadius: 5 }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Lora', serif", letterSpacing: "-0.01em" }}>
            WASSCE Analytics
          </span>
        </div>
      </header>

      {/* Sidebar — Suspense required because Sidebar uses useSearchParams() */}
      <Suspense fallback={<div className="dashboard-sidebar" />}>
        <Sidebar
          userEmail={userEmail}
          schoolName={schoolName}
          schoolNumber={schoolNumber}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
      </Suspense>

      {/* Backdrop — tap to close on mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Main content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
