import { db } from "@/db";
import { shops, orders, adminUsers } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Store, TrendingUp, Users, ExternalLink } from "lucide-react";
import { OnboardForm } from "./onboard-form";

export const metadata = { title: "Manage Shops — Super Admin" };

export default async function PlatformShopsPage() {
  await requirePlatformAdmin();

  const shopsList = await db
    .select({
      id: shops.id,
      name: shops.name,
      shopkeeperName: shops.shopkeeperName,
      email: shops.email,
      upiId: shops.upiId,
      createdAt: shops.createdAt,
      adminEmail: adminUsers.email,
      orderCount: sql<number>`cast(count(${orders.id}) as int)`,
      revenue: sql<string>`coalesce(sum(${orders.amount}), '0.00')`
    })
    .from(shops)
    .leftJoin(adminUsers, eq(adminUsers.shopId, shops.id))
    .leftJoin(orders, eq(orders.shopId, shops.id))
    .groupBy(shops.id, adminUsers.email)
    .orderBy(shops.createdAt);

  const totalOrders = shopsList.reduce((acc, s) => acc + s.orderCount, 0);
  const totalRevenue = shopsList.reduce((acc, s) => acc + parseFloat(s.revenue), 0);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Manage Shops</h1>
        <p className="mt-1 text-sm text-slate-400">
          Onboard new shopkeepers and manage existing ones. Each shopkeeper gets a separate admin login.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
              <Store className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{shopsList.length}</p>
              <p className="text-xs text-slate-400">Total Shops</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{totalOrders}</p>
              <p className="text-xs text-slate-400">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-slate-400">Network GMV</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        {/* Shops list */}
        <div className="grid gap-4">
          <h2 className="text-base font-bold text-white">
            {shopsList.length > 0 ? `${shopsList.length} Shops` : "No shops yet"}
          </h2>

          {shopsList.length === 0 ? (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-16 text-center text-slate-500">
                <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No shopkeepers onboarded yet</p>
                <p className="text-xs mt-1">Use the form to onboard your first shop.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {shopsList.map((shop) => (
                <Card key={shop.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
                  <CardHeader className="border-b border-white/10 p-4 pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                          <Store className="h-4 w-4 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{shop.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">UPI: {shop.upiId}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-teal-500/10 border border-teal-400/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300 shrink-0">
                        {shop.orderCount} orders
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Shopkeeper</p>
                      <p className="font-semibold text-white text-sm">{shop.shopkeeperName || "—"}</p>
                      <p className="text-xs text-slate-400 truncate">{shop.adminEmail || "No admin linked"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-sm text-slate-300 truncate" title={shop.email ?? ""}>
                        {shop.email || "—"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Joined {new Date(shop.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
                      <p className="font-bold text-emerald-400 text-base">{formatCurrency(parseFloat(shop.revenue))}</p>
                      <a
                        href={`/admin/orders`}
                        target="_blank"
                        className="text-xs text-teal-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        View orders <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Onboarding form */}
        <div className="lg:sticky lg:top-20">
          <OnboardForm />
          <div className="mt-4 rounded-xl bg-slate-800/50 border border-white/10 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-2">After onboarding:</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Share the shopkeeper login URL: <code className="text-teal-400 bg-white/5 px-1 rounded">/admin/login</code></li>
              <li>Give them their email and the password you set</li>
              <li>They can change their password from the Settings page</li>
              <li>Their print shop is live immediately — customers can select it on the homepage</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
