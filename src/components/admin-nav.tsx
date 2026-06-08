"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/admin/login/actions";

const adminNavItems = [
  { href: "/admin/orders", label: "Orders", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden sm:flex items-center gap-1">
        {adminNavItems.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href as any}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <form action={logout} className="ml-1">
          <button className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/80 flex items-stretch">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href as any}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? "text-[#003262]" : "text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#003262] rounded-b-full" />
              )}
            </Link>
          );
        })}
        <form action={logout} className="flex-1">
          <button className="w-full h-full relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-slate-400">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </form>
      </nav>
    </>
  );
}
