import { requirePlatformAdmin } from "@/lib/auth";
import { platformLogout } from "@/app/platform/login/actions";
import Link from "next/link";
import { LayoutDashboard, Store, LogOut, ShieldCheck } from "lucide-react";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin();

  const navItems = [
    { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/platform/shops", label: "Shops", icon: Store }
  ];

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Platform header — dark teal theme, visually distinct from shopkeeper admin */}
      <header className="bg-gradient-to-r from-slate-900 to-[#001a3a] border-b border-white/10 sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14">
          <Link href="/platform/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src="/DARKBG.png" alt="PrintFloww" className="h-8 w-auto object-contain" />
            <span className="rounded-md bg-teal-500/20 border border-teal-400/30 px-2 py-0.5 text-[11px] font-bold tracking-widest text-teal-300 uppercase flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Super Admin
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href as any}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/10">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-white leading-none">{session.user.email}</p>
                <p className="text-[10px] text-teal-400 font-medium mt-0.5">Super Admin</p>
              </div>
              <form action={platformLogout}>
                <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-white/10 flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href as any}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-slate-400 hover:text-teal-400 transition-colors"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <form action={platformLogout} className="flex-1">
          <button className="w-full h-full flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-slate-400">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </form>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:pb-8">
        {children}
      </div>
    </main>
  );
}
