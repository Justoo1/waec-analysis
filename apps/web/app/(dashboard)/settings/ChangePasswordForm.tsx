"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setCurrent(""); setNext(""); setConfirm("");
      }
    } finally {
      setLoading(false);
    }
  }

  const INPUT: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 6,
    border: "1px solid #E2E0D8", fontSize: 13, background: "#fff",
    boxSizing: "border-box", outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <div style={{ background: "#FDECEC", color: "#B83232", padding: "10px 14px", borderRadius: 6, fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#E6F4EC", color: "#1A6B47", padding: "10px 14px", borderRadius: 6, fontSize: 13 }}>
          Password updated successfully.
        </div>
      )}
      {[
        { label: "Current password", value: current, set: setCurrent },
        { label: "New password",     value: next,    set: setNext },
        { label: "Confirm new password", value: confirm, set: setConfirm },
      ].map(({ label, value, set }) => (
        <div key={label}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6B6860", marginBottom: 5 }}>
            {label}
          </label>
          <input
            type="password"
            value={value}
            onChange={(e) => set(e.target.value)}
            required
            style={INPUT}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        style={{
          alignSelf: "flex-start", padding: "9px 20px", borderRadius: 6,
          fontSize: 13, fontWeight: 500, background: "#1A6B47",
          color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
