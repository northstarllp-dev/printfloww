import { SiteShell } from "@/components/site-shell";
import { QuoteForm } from "./quote-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function QuotePage() {
  return (
    <SiteShell hideNav>
      <div className="grid gap-5 max-w-5xl mx-auto">
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#003262] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to upload
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Configure &amp; Quote</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set paper size, copies, and finishing options for each file.
          </p>
        </div>
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#003262] border-t-transparent" />
          </div>
        }>
          <QuoteForm />
        </Suspense>
      </div>
    </SiteShell>
  );
}
