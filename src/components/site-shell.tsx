import Link from "next/link";

export function SiteShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-normal text-stone-950">
            PrintFloww
          </Link>
          {!hideNav && (
            <nav className="flex items-center gap-4 text-sm text-stone-600">
              <Link href="/upload" className="hover:text-teal-700">
                Upload
              </Link>
              <Link href="/admin/orders" className="hover:text-teal-700">
                Admin
              </Link>
            </nav>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </main>
  );
}
