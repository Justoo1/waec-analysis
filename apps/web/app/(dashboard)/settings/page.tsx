import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";

const FIELD: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 0", borderBottom: "1px solid #E2E0D8", fontSize: 13,
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "super_admin") redirect("/admin");

  const { email, name, role, schoolName, schoolNumber } = session.user;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
          Settings
        </h1>
        <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>Account and school information</div>
      </div>

      {/* School info */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 14 }}>School</div>
        {[
          { label: "School name",   value: schoolName ?? "—" },
          { label: "School number", value: schoolNumber ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} style={FIELD}>
            <span style={{ color: "#6B6860" }}>{label}</span>
            <span style={{ color: "#0D1F17", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 14 }}>Account</div>
        {[
          { label: "Full name", value: name ?? "—" },
          { label: "Email",     value: email ?? "—" },
          { label: "Role",      value: role ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} style={FIELD}>
            <span style={{ color: "#6B6860" }}>{label}</span>
            <span style={{ color: "#0D1F17", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Change password */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F17", marginBottom: 18 }}>Change password</div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
