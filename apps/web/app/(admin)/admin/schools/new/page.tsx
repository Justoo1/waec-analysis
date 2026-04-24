"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3, "Required"),
  schoolNumber: z.string().regex(/^\d{7}$/, "Must be exactly 7 digits"),
  subdomain: z
    .string()
    .min(2, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  region: z.string().optional(),
  district: z.string().optional(),
  schoolType: z.string().min(1, "Required"),
  plan: z.enum(["free", "basic", "pro"]),
  adminFullName: z.string().min(2, "Required"),
  adminEmail: z.string().email("Invalid email"),
  adminPassword: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono", "Bono East", "Ahafo", "Western North",
  "North East", "Savannah",
];

const field = (label: string, error?: string, children: React.ReactNode = null) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>}
  </div>
);

const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "8px 12px",
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { schoolType: "SHS", plan: "free" },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const body = await res.json();
      setServerError(
        typeof body.error === "string"
          ? body.error
          : "Failed to register school. Check the fields and try again."
      );
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 600, margin: 0 }}>Register new school</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 0" }}>
          Creates the school record and an initial admin user who can log in immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── School details ── */}
        <section>
          <h2 style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 16px" }}>
            School details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {field("School name *", errors.name?.message,
              <input {...register("name")} placeholder="Achimota Senior High School" style={inputStyle} />
            )}
            {field("WAEC school number *", errors.schoolNumber?.message,
              <input {...register("schoolNumber")} placeholder="0040103" style={inputStyle} maxLength={7} />
            )}
            {field("Subdomain *", errors.subdomain?.message,
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <input
                  {...register("subdomain")}
                  placeholder="achimota"
                  style={{ ...inputStyle, borderRadius: "6px 0 0 6px", flex: 1 }}
                />
                <span
                  style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderLeft: "none",
                    borderRadius: "0 6px 6px 0",
                    padding: "8px 12px",
                    color: "#475569",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  .waecanalytics.com
                </span>
              </div>
            )}
            {field("School type", errors.schoolType?.message,
              <select {...register("schoolType")} style={inputStyle}>
                <option value="SHS">SHS</option>
                <option value="SHTS">SHTS</option>
                <option value="Technical">Technical</option>
                <option value="Vocational">Vocational</option>
              </select>
            )}
            {field("Region", errors.region?.message,
              <select {...register("region")} style={inputStyle}>
                <option value="">— Select region —</option>
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
            {field("District", errors.district?.message,
              <input {...register("district")} placeholder="Ablekuma North" style={inputStyle} />
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            {field("Plan", errors.plan?.message,
              <div style={{ display: "flex", gap: 8 }}>
                {(["free", "basic", "pro"] as const).map((p) => (
                  <label
                    key={p}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      padding: "7px 16px",
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 6,
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    <input {...register("plan")} type="radio" value={p} style={{ accentColor: "#3b82f6" }} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── First admin user ── */}
        <section>
          <h2 style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 16px" }}>
            First admin user
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {field("Full name *", errors.adminFullName?.message,
              <input {...register("adminFullName")} placeholder="Kwame Mensah" style={inputStyle} />
            )}
            {field("Email *", errors.adminEmail?.message,
              <input {...register("adminEmail")} type="email" placeholder="kwame@school.edu.gh" style={inputStyle} />
            )}
            {field("Initial password *", errors.adminPassword?.message,
              <input {...register("adminPassword")} type="password" placeholder="Min. 8 characters" style={inputStyle} />
            )}
          </div>
        </section>

        {serverError && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 6,
              padding: "10px 14px",
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {serverError}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? "#1e3a5f" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: isSubmitting ? "default" : "pointer",
            }}
          >
            {isSubmitting ? "Registering…" : "Register school"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: "transparent",
              color: "#64748b",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
