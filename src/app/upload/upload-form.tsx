"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allowedMimeTypes } from "@/lib/file-rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FileText, Upload, X, File as FileIcon, Loader2 } from "lucide-react";
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

  async function onSubmit(formData: FormData) {
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
        email: String(formData.get("email") ?? "")
      };

      const intentResponse = await fetch("/api/uploads/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customer,
          files: files.map((file) => ({ name: file.name, mimeType: file.type, sizeBytes: file.size }))
        })
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
          pageCount: estimatePageCount(file, text)
        });
      }

      sessionStorage.setItem("printfloww:draft", JSON.stringify({ customer, files: uploaded }));
      router.push("/quote");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Card className="overflow-hidden border-stone-200/60 shadow-sm">
        <div className="bg-stone-50/80 border-b border-stone-100 p-4 sm:px-6">
          <h2 className="font-semibold text-stone-900">Customer Details</h2>
        </div>
        <CardContent className="p-4 sm:p-6 grid gap-5 md:grid-cols-3">
          <Field label="Name">
            <Input name="name" required minLength={2} className="bg-white" />
          </Field>
          <Field label="Phone Number">
            <Input name="phone" required pattern="[6-9][0-9]{9}" className="bg-white" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" className="bg-white" />
          </Field>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-stone-200/60 shadow-sm">
        <div className="bg-stone-50/80 border-b border-stone-100 p-4 sm:px-6">
          <h2 className="font-semibold text-stone-900">Documents</h2>
        </div>
        <CardContent className="p-4 sm:p-6 grid gap-5">
          <div 
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 hover:bg-stone-50 transition-colors group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
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
            <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform shadow-sm ring-1 ring-teal-100">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-medium text-stone-900">Click to browse or drag files here</p>
                <p className="text-sm text-stone-500 mt-1">Maximum 10 files (50 MB total)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end my-2">
            <Button type="submit" disabled={isUploading || selectedFiles.length === 0} className="w-full sm:w-auto px-8 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all bg-teal-700 hover:bg-teal-800 disabled:opacity-70">
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {uploadProgress && uploadProgress.current > 0 ? `Uploading ${uploadProgress.current}/${uploadProgress.total} documents...` : "Preparing secure upload..."}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid gap-3 max-h-[260px] overflow-y-auto pr-2">
              {selectedFiles.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center gap-4 p-3 rounded-lg border border-stone-200 bg-white shadow-sm transition-all hover:border-teal-200 hover:shadow-md group">
                  <div className="h-10 w-10 shrink-0 rounded-md bg-teal-50/50 flex items-center justify-center text-teal-600 border border-teal-100/50">
                    <FileIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{file.name}</p>
                    <p className="text-xs text-stone-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    type="button" 
                    className="shrink-0 h-8 px-3 text-xs font-medium text-stone-600 bg-stone-100 hover:text-red-600 hover:bg-red-50 border border-stone-200 hover:border-red-100 rounded-md transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeFile(i);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-stone-500 mt-2 bg-stone-50 p-3 rounded-md border border-stone-100">
            <FileText className="h-4 w-4 shrink-0 text-teal-600" />
            <span>Files are uploaded directly to private <strong className="font-medium text-stone-700">Supabase Storage</strong> using secure signed URLs.</span>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</p> : null}
    </form>
  );
}
