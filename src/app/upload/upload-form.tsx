"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allowedMimeTypes } from "@/lib/file-rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FileText, Upload, File as FileIcon, Loader2, X, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadedFile = {
  id: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
};

function estimatePageCount(file: File, text?: string) {
  if (file.type.startsWith("image/")) return 1;
  if (file.type === "application/pdf" && text) {
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches?.length || null;
  }
  return null;
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        newFiles.forEach((file) => dt.items.add(file));
        fileInputRef.current.files = dt.files;
      }
      return newFiles;
    });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setIsUploading(true);

    try {
      const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
      if (files.length < 1 || files.length > 10) throw new Error("Upload between 1 and 10 files.");

      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > 50 * 1024 * 1024) throw new Error("Total upload size must be 50 MB or less.");
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])) {
          throw new Error(`${file.name} is not a supported file type.`);
        }
      }

      const customer = {
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
      };

      const intentResponse = await fetch("/api/uploads/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customer,
          files: files.map((file) => ({ name: file.name, mimeType: file.type, sizeBytes: file.size })),
        }),
      });

      if (!intentResponse.ok) throw new Error("Could not prepare private uploads.");
      const intent = await intentResponse.json();
      const supabase = createSupabaseBrowserClient();

      const uploaded: UploadedFile[] = [];
      setUploadProgress({ current: 0, total: files.length });

      for (let index = 0; index < files.length; index += 1) {
        setUploadProgress({ current: index + 1, total: files.length });
        const file = files[index];
        const signed = intent.uploads[index];
        const { error: uploadError } = await supabase.storage
          .from(intent.bucket)
          .uploadToSignedUrl(signed.storagePath, signed.token, file, { contentType: file.type });

        if (uploadError) throw new Error(uploadError.message);

        let text: string | undefined;
        if (file.type === "application/pdf") text = await file.text();

        uploaded.push({
          id: signed.id,
          originalName: signed.originalName,
          storagePath: signed.storagePath,
          mimeType: signed.mimeType,
          sizeBytes: signed.sizeBytes,
          pageCount: estimatePageCount(file, text),
        });
      }

      sessionStorage.setItem("printfloww:draft", JSON.stringify({ customer, files: uploaded }));
      router.push("/quote");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Customer details */}
      <Card>
        <div className="bg-[#003262] rounded-t-xl px-5 py-3.5">
          <h2 className="font-bold text-white text-sm">Customer Details</h2>
        </div>
        <CardContent className="p-4 sm:p-5 grid gap-4 sm:grid-cols-3">
          <Field label="Full Name">
            <Input name="name" required minLength={2} placeholder="Your name" />
          </Field>
          <Field label="Phone Number">
            <Input name="phone" required pattern="[6-9][0-9]{9}" placeholder="10-digit mobile" />
          </Field>
          <Field label="Email (optional)">
            <Input name="email" type="email" placeholder="you@example.com" />
          </Field>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <div className="bg-[#003262] rounded-t-xl px-5 py-3.5">
          <h2 className="font-bold text-white text-sm">Documents</h2>
        </div>
        <CardContent className="p-4 sm:p-5 grid gap-4">
          {/* Drop zone */}
          <label className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#003262]/50 hover:bg-slate-100/60 transition-all group cursor-pointer block">
            <input
              ref={fileInputRef}
              onChange={handleFileChange}
              name="files"
              type="file"
              multiple
              required
              accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
              className="hidden"
            />
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#003262]/10 flex items-center justify-center text-[#003262] group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                {selectedFiles.length > 0 ? (
                  <>
                    <p className="text-sm font-bold text-[#238822]">
                      {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Tap to add more files</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-800">Tap to browse or drag files here</p>
                    <p className="text-xs text-slate-500 mt-0.5">PDF, DOCX, PPTX, JPG, PNG · Max 10 files · 50 MB</p>
                  </>
                )}
              </div>
            </div>
          </label>

          {/* File list */}
          {selectedFiles.length > 0 && (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-[#003262]/30 transition-colors group"
                >
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-[#003262]/8 flex items-center justify-center">
                    <FileIcon className="h-4 w-4 text-[#003262]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeFile(i);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#238822] mt-0.5" />
            <span>
              Files are uploaded directly to private{" "}
              <strong className="font-semibold text-slate-700">Supabase Storage</strong>{" "}
              using secure signed URLs.
            </span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploadProgress && uploadProgress.current > 0
                  ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
                  : "Preparing secure upload…"}
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload &amp; Continue
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠</span>
          {error}
        </div>
      ) : null}
    </form>
  );
}
