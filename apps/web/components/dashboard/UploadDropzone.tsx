"use client";

import { useState } from "react";
import { CANDIDATES } from "@/lib/mock-data";

type UploadState = "empty" | "parsing" | "preview";

const PREVIOUS_UPLOADS = [
  { year: 2024, date: "12 Jan 2025", count: 909 },
  { year: 2023, date: "08 Feb 2024", count: 872 },
];

export function UploadDropzone() {
  const [state, setState] = useState<UploadState>("empty");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  function simulateParse() {
    setState("parsing");
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 4 + 1;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => setState("preview"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 120);
  }

  const candSoFar = Math.floor((progress / 100) * 909);
  const pageSoFar = Math.floor((progress / 100) * 191);

  if (state === "parsing") {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "32px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>WAEC_Results_Listing_25.pdf</div>
            <div style={{ fontSize: 12, color: "#6B6860" }}>Parsing in progress…</div>
          </div>
        </div>
        <div style={{ height: 8, background: "#F0EDE6", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
          <div
            style={{ height: "100%", width: `${progress}%`, background: "#1A6B47", borderRadius: 4, transition: "width 0.1s linear" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B6860" }}>
          <span>Parsing page {pageSoFar} of 191…</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#1A6B47" }}>
            {Math.floor(progress)}%
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6B6860", marginTop: 6 }}>{candSoFar} candidates found so far</div>
      </div>
    );
  }

  if (state === "preview") {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 22, color: "#1A6B47" }}>✓</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1F17" }}>Successfully parsed 909 candidates</div>
            <div style={{ fontSize: 12, color: "#6B6860" }}>Exam Year detected: <strong>2025</strong></div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: 8 }}>
          Sample (first 5 candidates)
        </div>
        <div style={{ background: "#FAFAF8", borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
          {CANDIDATES.slice(0, 5).map((c, i) => (
            <div
              key={c.index}
              style={{
                display: "flex", gap: 12, padding: "9px 14px", fontSize: 12,
                borderBottom: i < 4 ? "1px solid #E2E0D8" : "none",
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6B6860", flexShrink: 0 }}>{c.index}</span>
              <span style={{ flex: 1, fontWeight: 500, color: "#0D1F17" }}>{c.name}</span>
              <span style={{ color: "#6B6860" }}>{c.gender}</span>
              <span style={{ color: "#6B6860" }}>{c.total} subjects</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#FEF3E2", borderRadius: 6, padding: "10px 14px", marginBottom: 24, fontSize: 12, color: "#C07818" }}>
          ⚠ This will replace any existing 2025 data. This action cannot be undone.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setState("empty")}
            style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#0D1F17", border: "1px solid #E2E0D8" }}
          >
            Cancel
          </button>
          <button
            onClick={() => setState("empty")}
            style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "#1A6B47", color: "#fff", border: "none" }}
          >
            Confirm Import →
          </button>
        </div>
      </div>
    );
  }

  // empty state
  return (
    <div style={{ maxWidth: 660 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); simulateParse(); }}
        onClick={simulateParse}
        style={{
          border: `2px dashed ${dragging ? "#1A6B47" : "#E2E0D8"}`,
          borderRadius: 12,
          padding: "56px 32px",
          textAlign: "center",
          background: dragging ? "#EEF6F2" : "#fff",
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12, color: dragging ? "#1A6B47" : "#6B6860" }}>⬆</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: "#0D1F17", marginBottom: 6 }}>
          Drop your WAEC results file here
        </div>
        <div style={{ fontSize: 13, color: "#6B6860", marginBottom: 20 }}>or click to browse</div>
        <div style={{ display: "inline-flex", gap: 12 }}>
          {["PDF — WAEC Results Listing", "XLSX — WAEC Analysis Sheet"].map((f) => (
            <div key={f} style={{ background: "#F0EDE6", borderRadius: 5, padding: "5px 12px", fontSize: 12, color: "#6B6860" }}>
              {f}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 10 }}>
          Previous Uploads
        </div>
        {PREVIOUS_UPLOADS.map((u) => (
          <div
            key={u.year}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #E2E0D8" }}
          >
            <span style={{ fontSize: 14, color: "#1A6B47" }}>✓</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>WASSCE {u.year}</span>
              <span style={{ fontSize: 12, color: "#6B6860", marginLeft: 10 }}>
                Imported {u.date} · {u.count} candidates
              </span>
            </div>
            <button style={{ fontSize: 12, color: "#1A6B47", background: "none", border: "none", cursor: "pointer" }}>
              View →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
