import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Upload Results</h1>
        <p className="text-sm text-muted-foreground">
          Upload a WAEC Results Listing PDF or XLSX file to import candidates.
        </p>
      </div>

      <UploadDropzone />
    </div>
  );
}
