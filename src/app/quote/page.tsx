import { SiteShell } from "@/components/site-shell";
import { QuoteForm } from "./quote-form";

export default function QuotePage() {
  return (
    <SiteShell hideNav>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Quote</h1>
          <p className="mt-2 text-sm text-stone-600">Confirm extracted metadata, choose print options, and generate a payable quote.</p>
        </div>
        <QuoteForm />
      </div>
    </SiteShell>
  );
}
