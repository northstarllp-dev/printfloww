import { SiteShell } from "@/components/site-shell";
import { QuoteForm } from "./quote-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        <QuoteForm />
      </div>
    </SiteShell>
  );
}
