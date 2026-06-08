"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
];

export function SiteShell({
  children,
  hideNav = false,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Top header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="PrintFloww"
              className="h-8 w-auto object-contain"
            />
          </Link>
          {!hideNav && <div className="hidden sm:flex items-center gap-1">
                  {navItems.map(({ href, label }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href as any}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          active
                            ? "bg-[#003262] text-white"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
          }
        </div>
      </header>

      {/* Page content */}
      <main
        className={`mx-auto max-w-6xl px-4 py-6 ${
          !hideNav ? "pb-24 sm:pb-8" : "pb-8"
        }`}
      >
        {children}
      </main>

      {/* Mobile bottom nav — only when nav is not hidden */}
      {!hideNav && (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/80 flex items-stretch">
          {navItems.map(({ href, label, icon: Icon }) => {
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
        </nav>
      )}
    </div>
  );
}
