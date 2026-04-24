"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export type SchoolRow = {
  id: number;
  name: string;
  schoolNumber: string;
  subdomain: string;
  region: string | null;
  district: string | null;
  schoolType: string | null;
  plan: string | null;
  isActive: boolean | null;
  createdAt: Date | string | null;
  userCount: number;
  adminEmail: string | null;
};

const editSchema = z.object({
  name: z.string().min(3, "Required"),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  region: z.string().optional(),
  district: z.string().optional(),
  schoolType: z.string().min(1),
  plan: z.enum(["free", "basic", "pro"]),
  isActive: z.boolean(),
});
type EditValues = z.infer<typeof editSchema>;

const GHANA_REGIONS = [
  "Greater Accra","Ashanti","Western","Eastern","Central","Northern",
  "Upper East","Upper West","Volta","Brong-Ahafo","Oti","Bono",
  "Bono East","Ahafo","Western North","North East","Savannah",
];

const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "7px 10px",
  color: "#f1f5f9",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  display: "block",
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value ?? "—"}</span>
    </div>
  );
}

export function SchoolSheet({
  school,
  onClose,
  onUpdated,
  onDeleted,
}: {
  school: SchoolRow;
  onClose: () => void;
  onUpdated: (s: SchoolRow) => void;
  onDeleted: (id: number) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "password">("view");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: school.name,
      subdomain: school.subdomain,
      region: school.region ?? "",
      district: school.district ?? "",
      schoolType: school.schoolType ?? "SHS",
      plan: (school.plan as "free" | "basic" | "pro") ?? "free",
      isActive: school.isActive ?? true,
    },
  });

  const onSave = async (data: EditValues) => {
    setServerError(null);
    const res = await fetch(`/api/admin/schools/${school.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated({ ...school, ...updated });
      setMode("view");
      router.refresh();
    } else {
      const body = await res.json();
      setServerError(typeof body.error === "string" ? body.error : "Update failed.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/schools/${school.id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      onDeleted(school.id);
      onClose();
      router.refresh();
    } else {
      setDeleting(false);
      setConfirmDelete(false);
      setServerError("Delete failed. Try again.");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
          animation: "fadeIn 150ms ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420,
          background: "#1e293b",
          borderLeft: "1px solid #334155",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 200ms ease",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600, margin: 0 }}>{school.name}</h2>
            <code style={{ color: "#64748b", fontSize: 12 }}>{school.schoolNumber}</code>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {mode === "view" ? (
            <>
              <InfoRow label="School number" value={<code style={{ fontFamily: "monospace" }}>{school.schoolNumber}</code>} />
              <InfoRow label="Subdomain" value={`${school.subdomain}.waecanalytics.com`} />
              <InfoRow label="Type" value={school.schoolType} />
              <InfoRow label="Region" value={school.region} />
              <InfoRow label="District" value={school.district} />
              <InfoRow label="Plan" value={<PlanBadge plan={school.plan ?? "free"} />} />
              <InfoRow label="Status" value={
                <span style={{ color: school.isActive ? "#4ade80" : "#f87171", fontSize: 12 }}>
                  {school.isActive ? "Active" : "Inactive"}
                </span>
              } />
              <InfoRow label="Admin email" value={school.adminEmail} />
              <InfoRow label="Users" value={school.userCount} />
              <InfoRow label="Registered" value={school.createdAt ? new Date(school.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
              <button
                onClick={() => { setMode("password"); setServerError(null); }}
                style={{ marginTop: 16, background: "transparent", border: "none", color: "#60a5fa", fontSize: 13, cursor: "pointer", padding: 0, textAlign: "left" }}
              >
                Change school login password →
              </button>
            </>
          ) : mode === "password" ? (
            <PasswordForm
              schoolId={school.id}
              onSuccess={() => { setMode("view"); setServerError(null); }}
              onCancel={() => { setMode("view"); setServerError(null); }}
            />
          ) : (
            <form id="edit-form" onSubmit={handleSubmit(onSave)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="School name" error={errors.name?.message}>
                <input {...register("name")} style={inputStyle} />
              </Field>
              <Field label="Subdomain" error={errors.subdomain?.message}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input {...register("subdomain")} style={{ ...inputStyle, borderRadius: "6px 0 0 6px" }} />
                  <span style={{ background: "#0f172a", border: "1px solid #334155", borderLeft: "none", borderRadius: "0 6px 6px 0", padding: "7px 8px", color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>
                    .waecanalytics.com
                  </span>
                </div>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Type" error={errors.schoolType?.message}>
                  <select {...register("schoolType")} style={inputStyle}>
                    {["SHS","SHTS","Technical","Vocational"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Plan" error={errors.plan?.message}>
                  <select {...register("plan")} style={inputStyle}>
                    {["free","basic","pro"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Region" error={errors.region?.message}>
                <select {...register("region")} style={inputStyle}>
                  <option value="">— Select —</option>
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="District" error={errors.district?.message}>
                <input {...register("district")} style={inputStyle} />
              </Field>
              <Field label="Status" error={errors.isActive?.message}>
                <select {...register("isActive", { setValueAs: v => v === "true" || v === true })} style={inputStyle}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
              {serverError && (
                <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 6, padding: "8px 12px", color: "#fca5a5", fontSize: 13 }}>
                  {serverError}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #334155", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "view" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setMode("edit")}
                style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "9px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Edit school
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ flex: 1, background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 6, padding: "9px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Delete school
              </button>
            </div>
          ) : mode === "password" ? null : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                form="edit-form"
                disabled={isSubmitting}
                style={{ flex: 1, background: isSubmitting ? "#1e3a5f" : "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "9px 0", fontSize: 13, fontWeight: 500, cursor: isSubmitting ? "default" : "pointer" }}
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={() => { setMode("view"); setServerError(null); }}
                style={{ flex: 1, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "9px 0", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 6, padding: "12px 14px" }}>
              <p style={{ color: "#fca5a5", fontSize: 13, margin: "0 0 10px" }}>
                Permanently delete <strong>{school.name}</strong> and all its users? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 13, cursor: deleting ? "default" : "pointer" }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "7px 0", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

function PasswordForm({
  schoolId,
  onSuccess,
  onCancel,
}: {
  schoolId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/schools/${schoolId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(onSuccess, 1200);
    } else {
      const body = await res.json();
      setError(typeof body.error === "string" ? body.error : "Failed to update password.");
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#4ade80", fontSize: 14 }}>
        Password updated successfully.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>
          Set a new login password for this school&apos;s admin account.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          style={inputStyle}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          style={inputStyle}
        />
      </div>
      {error && (
        <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 6, padding: "8px 12px", color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{ flex: 1, background: saving ? "#1e3a5f" : "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "9px 0", fontSize: 13, fontWeight: 500, cursor: saving ? "default" : "pointer" }}
        >
          {saving ? "Saving…" : "Set password"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "9px 0", fontSize: 13, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    free: { bg: "#1e293b", text: "#64748b" },
    basic: { bg: "#1e3a5f", text: "#60a5fa" },
    pro: { bg: "#1a2e1a", text: "#4ade80" },
  };
  const c = colors[plan] ?? colors.free;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {plan}
    </span>
  );
}
