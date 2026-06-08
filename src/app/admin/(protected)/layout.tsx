import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensures only SHOPKEEPER role can access /admin — platform owners are redirected to /platform/login
  await requireAdmin();

  return (
    <main className="min-h-screen bg-[#f0f4f8]">
      {/* Navy top header */}
      <header className="bg-[#003262] sticky top-0 z-40 shadow-lg shadow-[#003262]/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          <Link href="/admin/orders" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/DARKBG.png"
              alt="PrintFloww"
              className="h-8 w-auto object-contain"
            />
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-widest text-white uppercase">
              Admin
            </span>
          </Link>
          <AdminNav />
        </div>
      </header>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-8">
        {children}
      </div>
    </main>
  );
}
