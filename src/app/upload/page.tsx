import { SiteShell } from "@/components/site-shell";
import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <SiteShell hideNav>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Upload Documents</h1>
          <p className="mt-2 text-sm text-stone-600">PDF, DOCX, PPTX, JPG, and PNG. Maximum 10 files and 50 MB total.</p>
        </div>
        <UploadForm />
      </div>
    </SiteShell>
  );
}
