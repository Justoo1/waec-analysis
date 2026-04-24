"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadDropzone() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pdf|xlsx)$/i)) {
      setMessage("Only PDF and XLSX files are accepted.");
      setState("error");
      return;
    }

    setState("uploading");
    setProgress(0);
    setMessage(null);

    // TODO: POST to /api/upload → parser service
    // Simulate progress for skeleton
    for (let i = 10; i <= 90; i += 10) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }
    setProgress(100);
    setState("success");
    setMessage(`${file.name} uploaded successfully. Processing in background.`);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
        className={[
          "flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          state === "dragging"
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30",
        ].join(" ")}
      >
        {state === "uploading" ? (
          <>
            <p className="text-sm text-muted-foreground">Uploading…</p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drag & drop a WAEC Results file here
            </p>
            <p className="text-xs text-muted-foreground">PDF or XLSX accepted</p>
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Browse files</span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.xlsx"
              className="sr-only"
              onChange={onInputChange}
            />
          </>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${state === "error" ? "text-destructive" : "text-green-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
