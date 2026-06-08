import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { FileUp, IndianRupee, ShieldCheck, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const features: Array<{ icon: LucideIcon; title: string; body: string; color: string; iconBg: string }> = [
  {
    icon: ShieldCheck,
    title: "Private storage",
    body: "Files stay in private Supabase Storage buckets, ensuring your sensitive documents never leave a secure environment.",
    color: "text-[#003262]",
    iconBg: "bg-[#003262]",
  },
  {
    icon: IndianRupee,
    title: "Instant quote",
    body: "Pricing is pulled from admin-controlled shop settings so you always know the exact cost upfront.",
    color: "text-[#238822]",
    iconBg: "bg-[#238822]",
  },
  {
    icon: FileUp,
    title: "Online status",
    body: "Track your order using a cryptographically random token — no login or account required.",
    color: "text-[#562500]",
    iconBg: "bg-[#562500]",
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      {/* Hero card */}
      <div className="relative rounded-2xl bg-[#003262] overflow-hidden mb-5 p-6 sm:p-8">
        {/* Decorative gradient blobs */}
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #238822 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <img
            src="/DARKBG.png"
            alt="PrintFloww"
            className="h-9 w-auto object-contain mb-5"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-3">
            Print smarter,<br className="sm:hidden" /> track everything.
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mb-6 max-w-sm leading-relaxed">
            Upload print files, configure paper &amp; finishing, pay with UPI, and track your job — no WhatsApp needed.
          </p>
          <Link href="/upload">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <FileUp className="h-5 w-5" />
              Start Order
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body, iconBg }) => (
          <div
            key={title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}
