import { logout } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin/orders" className="text-lg font-semibold text-stone-950">
            PrintFloww Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/orders" className="text-stone-600 hover:text-teal-700">
              Orders
            </Link>
            <Link href="/admin/settings" className="text-stone-600 hover:text-teal-700">
              Settings
            </Link>
            <form action={logout}>
              <Button className="h-9 bg-stone-900 hover:bg-stone-800">Logout</Button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </main>
  );
}
