import { SiteShell } from "@/components/site-shell";
import { UploadForm } from "./upload-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { shops } from "@/db/schema";

export default async function UploadPage(props: { searchParams: Promise<{ shopId?: string }> }) {
  const searchParams = await props.searchParams;
  const defaultShopId = searchParams.shopId || "";
  const allShops = await db.select({ id: shops.id, name: shops.name }).from(shops);

  return (
    <SiteShell hideNav>
      <div className="grid gap-5 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#003262] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Upload Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            PDF, DOCX, PPTX, JPG, and PNG · Maximum 10 files and 50 MB total.
          </p>
        </div>

        <UploadForm shops={allShops} defaultShopId={defaultShopId} />
      </div>
    </SiteShell>
  );
}
