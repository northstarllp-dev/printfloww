import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { FileUp, ClipboardList, CheckCircle2, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
 
const steps: Array<{ icon: LucideIcon; title: string; body: string; iconBg: string }> = [
  {
    icon: FileUp,
    title: "1. Upload Documents",
    body: "Choose your print shop, enter your name/phone, and upload your PDF, DOCX, PPTX, or image files.",
    iconBg: "bg-[#003262]",
  },
  {
    icon: ClipboardList,
    title: "2. Configure & Pay",
    body: "Select copies, paper size, colors, spiral binding, and pay securely online using UPI.",
    iconBg: "bg-[#238822]",
  },
  {
    icon: CheckCircle2,
    title: "3. Track & Collect",
    body: "Watch the status live. When it shows 'Ready for Pickup', go to the counter and show your tracking code to collect.",
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
 
      {/* Procedure Steps */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">How it works: Print Pickup Procedure</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body, iconBg }) => (
          <div
            key={title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}
