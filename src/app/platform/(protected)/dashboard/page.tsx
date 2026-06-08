import { db } from "@/db";
import { shops, orders, adminUsers } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Store, TrendingUp, Users, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Super Admin Dashboard — PrintFloww" };

export default async function PlatformDashboardPage() {
  await requirePlatformAdmin();

  // Fetch shops with aggregate stats
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

  const totalShops = shopsList.length;
  const totalOrders = shopsList.reduce((acc, s) => acc + s.orderCount, 0);
  const totalRevenue = shopsList.reduce((acc, s) => acc + parseFloat(s.revenue), 0);

  const metrics = [
    {
      label: "Active Print Shops",
      value: totalShops,
      icon: Store,
      color: "text-teal-400",
      bg: "bg-teal-400/10 border-teal-400/20"
    },
    {
      label: "Total Orders Placed",
      value: totalOrders,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20"
    },
    {
      label: "Network GMV",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20"
    }
  ];

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Super Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of all shops, shopkeepers, and printing activity.
          </p>
        </div>
        <Link
          href="/platform/shops"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all"
        >
          <Store className="h-4 w-4" />
          Manage Shops
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shops list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-400" />
            Shop Activity
          </h2>
          <Link
            href="/platform/shops"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors"
          >
            Onboard new shop <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {shopsList.length === 0 ? (
          <Card className="bg-white/5 border-white/10 border-dashed">
            <CardContent className="py-16 text-center text-slate-500">
              <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No shops onboarded yet</p>
              <p className="text-xs mt-1">
                <Link href="/platform/shops" className="text-teal-400 hover:underline">
                  Go to Shops →
                </Link>{" "}
                to onboard your first shop.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {shopsList.map((shop) => (
              <Card
                key={shop.id}
                className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Shop name + shopkeeper */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                          <Store className="h-4 w-4 text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{shop.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {shop.shopkeeperName || "—"} &bull; {shop.adminEmail || "No admin linked"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{shop.orderCount}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">
                          {formatCurrency(parseFloat(shop.revenue))}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">Revenue</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
