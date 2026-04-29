import { UploadDropzone } from "@/components/dashboard/UploadDropzone";

export default function UploadPage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E0D8" }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 500, color: "#0D1F17", margin: 0 }}>
            Upload Results
          </h1>
          <div style={{ fontSize: 13, color: "#6B6860", marginTop: 4 }}>
            Import your WASSCE results file to begin analysis
          </div>
        </div>
      </div>

      <UploadDropzone />
    </div>
  );
}
