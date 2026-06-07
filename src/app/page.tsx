import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { FileUp, IndianRupee, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <SiteShell hideNav>
      <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-stone-950 md:text-5xl">
              PrintFloww
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-600">
              Upload print files, configure paper and finishing, pay with UPI, and track the job without a WhatsApp thread.
            </p>
          </div>
          <Link href="/upload">
            <Button className="w-fit">
              <FileUp className="h-4 w-4" />
              Start Order
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          {([
            ["Private storage", "Files stay in private Supabase Storage buckets.", ShieldCheck],
            ["Instant quote", "Pricing is pulled from admin-controlled shop settings.", IndianRupee],
            ["Online status", "Customers track using a cryptographically random token.", FileUp]
          ] satisfies Array<[string, string, LucideIcon]>).map(([title, body, Icon]) => (
            <div key={String(title)} className="flex gap-3 border-b border-stone-100 py-3 last:border-0">
              <Icon className="mt-1 h-5 w-5 text-teal-700" />
              <div>
                <p className="font-medium text-stone-950">{title}</p>
                <p className="text-sm leading-6 text-stone-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
