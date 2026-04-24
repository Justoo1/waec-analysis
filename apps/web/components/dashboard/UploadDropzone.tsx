"use client";

import { useEffect, useRef, useState } from "react";

type UploadState = "empty" | "parsing" | "preview" | "error";

interface Sitting {
  id: number;
  year: number;
  totalCandidates: number | null;
  parsedAt: string;
}

export function UploadDropzone() {
  const [state, setState] = useState<UploadState>("empty");
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedCount, setParsedCount] = useState(0);
  const [parsedYear, setParsedYear] = useState<number | null>(null);
  const [sittingYear, setSittingYear] = useState(new Date().getFullYear());
  const [errorMsg, setErrorMsg] = useState("");
  const [sittings, setSittings] = useState<Sitting[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/sittings")
      .then((r) => r.json())
      .then((d) => setSittings(d.sittings ?? []))
      .catch(() => {});
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function pollStatus(taskId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const resp = await fetch(`/api/upload/status/${taskId}`);
        const data = await resp.json();

        if (data.status === "PROGRESS" && data.result) {
          setProgress(data.result.progress ?? 0);
          setProgressStage(data.result.stage ?? "");
          if (data.result.total_candidates) {
            setParsedCount(data.result.total_candidates);
          }
        } else if (data.status === "SUCCESS" && data.result) {
          stopPolling();
          setProgress(100);
          setParsedCount(data.result.total_candidates ?? 0);
          setParsedYear(sittingYear);
          setState("preview");
          // Refresh sittings list
          fetch("/api/sittings")
            .then((r) => r.json())
            .then((d) => setSittings(d.sittings ?? []))
            .catch(() => {});
        } else if (data.status === "FAILURE") {
          stopPolling();
          setErrorMsg("Parsing failed. Please check the file format and try again.");
          setState("error");
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 2000);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setProgress(0);
    setProgressStage("uploading");
    setState("parsing");
    setParsedCount(0);

    const form = new FormData();
    form.append("file", file);
    form.append("sitting_year", String(sittingYear));

    try {
      const resp = await fetch("/api/upload", { method: "POST", body: form });
      const data = await resp.json();

      if (!resp.ok) {
        setErrorMsg(data.error ?? "Upload failed. Please try again.");
        setState("error");
        return;
      }

      pollStatus(data.task_id);
    } catch {
      setErrorMsg("Could not reach the server. Please try again.");
      setState("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // ── Parsing state ───────────────────────────────────────────────────────────
  if (state === "parsing") {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "32px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1F17" }}>{fileName}</div>
            <div style={{ fontSize: 12, color: "#6B6860" }}>
              {progressStage === "uploading" ? "Uploading…" :
               progressStage === "parsing"  ? "Parsing file…" :
               progressStage === "schema_ready" ? "Preparing database…" :
               progressStage === "persisted" ? "Saving candidates…" :
               "Processing…"}
            </div>
          </div>
        </div>
        <div style={{ height: 8, background: "#F0EDE6", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#1A6B47",
              borderRadius: 4,
              transition: "width 0.3s linear",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B6860" }}>
          <span>{parsedCount > 0 ? `${parsedCount} candidates found so far` : "Working…"}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#1A6B47" }}>
            {Math.floor(progress)}%
          </span>
        </div>
      </div>
    );
  }

  // ── Preview / confirmation state ────────────────────────────────────────────
  if (state === "preview") {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 22, color: "#1A6B47" }}>✓</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1F17" }}>
              Successfully imported {parsedCount.toLocaleString()} candidates
            </div>
            <div style={{ fontSize: 12, color: "#6B6860" }}>
              Exam Year: <strong>{parsedYear}</strong>
            </div>
          </div>
        </div>
        <div style={{ background: "#EEF6F2", borderRadius: 6, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#1A6B47" }}>
          Dashboard data has been updated. Navigate to Results or Subjects to explore.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => { setState("empty"); setProgress(0); }}
            style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "#1A6B47", color: "#fff", border: "none" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22, color: "#B83232" }}>✕</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0D1F17" }}>Import failed</div>
        </div>
        <div style={{ fontSize: 13, color: "#B83232", marginBottom: 20 }}>{errorMsg}</div>
        <button
          onClick={() => { setState("empty"); setProgress(0); setErrorMsg(""); }}
          style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "#0D1F17", color: "#fff", border: "none" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Empty / default state ───────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 660 }}>
      {/* Year picker */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>Exam Year:</label>
        <select
          value={sittingYear}
          onChange={(e) => setSittingYear(Number(e.target.value))}
          style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E0D8", background: "#fff", cursor: "pointer" }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset so the same file can be re-uploaded
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
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

      {/* Previous uploads */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B6860", marginBottom: 10 }}>
          Previous Uploads
        </div>
        {sittings.length === 0 && (
          <div style={{ fontSize: 13, color: "#6B6860", padding: "8px 0" }}>No uploads yet.</div>
        )}
        {sittings.map((u) => (
          <div
            key={u.id}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #E2E0D8" }}
          >
            <span style={{ fontSize: 14, color: "#1A6B47" }}>✓</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#0D1F17" }}>WASSCE {u.year}</span>
              <span style={{ fontSize: 12, color: "#6B6860", marginLeft: 10 }}>
                {u.totalCandidates != null ? `${u.totalCandidates.toLocaleString()} candidates` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
