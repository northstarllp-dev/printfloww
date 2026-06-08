import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminStatuses, statusLabels } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import { desc, eq, sql, inArray } from "drizzle-orm";
import Link from "next/link";
import { transitionOrder } from "./[id]/actions";
import { RealtimeOrders } from "@/components/realtime-orders";
import { Package, Clock, Printer, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const statusColors: Record<string, string> = {
  PAYMENT_VERIFICATION_PENDING: "bg-amber-50 border-amber-200 text-amber-700",
  PAID: "bg-[#238822]/10 border-[#238822]/30 text-[#238822]",
  PRINTING: "bg-blue-50 border-blue-200 text-blue-700",
  READY_FOR_PICKUP: "bg-[#003262]/10 border-[#003262]/30 text-[#003262]",
  COMPLETED: "bg-slate-100 border-slate-200 text-slate-600",
  PAYMENT_REJECTED: "bg-red-50 border-red-200 text-red-600",
};

const statusDotColors: Record<string, string> = {
  PAYMENT_VERIFICATION_PENDING: "bg-amber-400",
  PAID: "bg-[#238822]",
  PRINTING: "bg-blue-500",
  READY_FOR_PICKUP: "bg-[#003262]",
  COMPLETED: "bg-slate-400",
  PAYMENT_REJECTED: "bg-red-500",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin();
  const { status, page } = await searchParams;
  const validStatus = adminStatuses.find((item) => item === status);

  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 20;

  const [rows, countStats] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(validStatus ? eq(orders.status, validStatus) : inArray(orders.status, adminStatuses))
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset((pageNum - 1) * pageSize),
    db
      .select({ status: orders.status, count: sql<number>`cast(count(${orders.id}) as int)` })
      .from(orders)
      .groupBy(orders.status),
  ]);

  const counts = Object.fromEntries(
    adminStatuses.map((item) => [item, countStats.find((c) => c.status === item)?.count ?? 0])
  );

  const currentCount = validStatus
    ? (counts[validStatus] ?? 0)
    : Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(currentCount / pageSize));

  // Stat chips for top
  const pendingCount = counts["PAYMENT_VERIFICATION_PENDING"] ?? 0;
  const printingCount = counts["PRINTING"] ?? 0;
  const readyCount = counts["READY_FOR_PICKUP"] ?? 0;

  return (
    <div className="grid gap-5">
      <RealtimeOrders />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review payments, manage print progress, and inspect submitted files.
        </p>
      </div>

      {/* Quick-glance stat chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-700">{pendingCount}</p>
          <p className="text-xs font-semibold text-amber-600 mt-0.5">Pending Review</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-700">{printingCount}</p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">Printing</p>
        </div>
        <div className="bg-[#003262]/10 border border-[#003262]/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-[#003262]">{readyCount}</p>
          <p className="text-xs font-semibold text-[#003262]/80 mt-0.5">Ready</p>
        </div>
      </div>

      {/* Main card with tabs + order grid */}
      <Card className="overflow-hidden">
        {/* Status tab bar */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-3 pt-3">
          <nav className="flex overflow-x-auto gap-1 pb-3" aria-label="Order status filters">
            <Link
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                !validStatus
                  ? "bg-[#003262] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white"
              }`}
              href="/admin/orders"
            >
              All ({Object.values(counts).reduce((a, b) => a + b, 0)})
            </Link>
            {adminStatuses.map((item) => (
              <Link
                key={item}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  validStatus === item
                    ? "bg-[#003262] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white"
                }`}
                href={`/admin/orders?status=${item}`}
              >
                {statusLabels[item]} ({counts[item] ?? 0})
              </Link>
            ))}
          </nav>
        </div>

        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length > 0 ? (
              rows.map((order) => (
                <Card
                  key={order.id}
                  className="relative overflow-hidden border-slate-200 flex flex-col hover:border-[#003262]/30 hover:shadow-md transition-all group"
                >
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View order ${order.id}`}
                  />

                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2 z-10 pointer-events-none">
                    <div>
                      <p className="text-xs font-bold text-[#003262] font-mono">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">{order.customerName}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        statusColors[order.status] ?? "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          statusDotColors[order.status] ?? "bg-slate-400"
                        }`}
                      />
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  {/* Amount highlight */}
                  <div className="mx-4 mb-3 bg-[#003262]/5 border border-[#003262]/10 rounded-lg px-3 py-2 z-10 pointer-events-none">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount</p>
                    <p className="text-lg font-extrabold text-[#003262]">
                      {formatCurrency(Number(order.amount))}
                    </p>
                  </div>

                  {/* Details */}
                  <CardContent className="px-4 pb-3 pt-0 grid gap-1 z-10 pointer-events-none flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-semibold text-slate-700">{order.customerPhone}</span>
                    </div>
                    {order.customerEmail && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={order.customerEmail}>
                          {order.customerEmail}
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 pt-2 border-t border-slate-100 border-dashed">
                      {order.createdAt.toLocaleString("en-IN")}
                    </p>
                  </CardContent>

                  {/* Action buttons */}
                  {order.status !== "COMPLETED" && order.status !== "PAYMENT_REJECTED" && (
                    <CardFooter className="z-10 bg-slate-50 border-t border-slate-100 p-3 gap-2">
                      {order.status === "PAYMENT_VERIFICATION_PENDING" && (
                        <>
                          <form action={transitionOrder} className="flex-1">
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="toStatus" value="PAID" />
                            <Button type="submit" variant="secondary" size="sm" className="w-full">
                              Approve
                            </Button>
                          </form>
                          <form action={transitionOrder} className="flex-1">
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="toStatus" value="PAYMENT_REJECTED" />
                            <Button type="submit" variant="destructive" size="sm" className="w-full">
                              Reject
                            </Button>
                          </form>
                        </>
                      )}
                      {order.status === "PAID" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="PRINTING" />
                          <Button type="submit" variant="primary" size="sm" className="w-full">
                            <Printer className="h-3.5 w-3.5" />
                            Mark Printing
                          </Button>
                        </form>
                      )}
                      {order.status === "PRINTING" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="READY_FOR_PICKUP" />
                          <Button type="submit" variant="primary" size="sm" className="w-full">
                            <Package className="h-3.5 w-3.5" />
                            Mark Ready
                          </Button>
                        </form>
                      )}
                      {order.status === "READY_FOR_PICKUP" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="COMPLETED" />
                          <Button type="submit" variant="secondary" size="sm" className="w-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                        </form>
                      )}
                    </CardFooter>
                  )}

                  {/* Completed state footer */}
                  {(order.status === "COMPLETED" || order.status === "PAYMENT_REJECTED") && (
                    <div className="z-10 bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        View details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">No orders found</p>
                <p className="text-sm mt-1">Orders will appear here once customers place them.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 mt-5 pt-4 text-sm font-medium text-slate-600">
              <span>
                Page {pageNum} of {totalPages}
              </span>
              <div className="flex gap-2">
                {pageNum > 1 ? (
                  <Link
                    href={`/admin/orders?${validStatus ? `status=${validStatus}&` : ""}page=${pageNum - 1}`}
                    className="px-3 py-1.5 rounded-lg hover:bg-[#003262]/5 text-slate-600 hover:text-[#003262] transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-slate-300">Previous</span>
                )}
                {pageNum < totalPages ? (
                  <Link
                    href={`/admin/orders?${validStatus ? `status=${validStatus}&` : ""}page=${pageNum + 1}`}
                    className="px-3 py-1.5 rounded-lg hover:bg-[#003262]/5 text-slate-600 hover:text-[#003262] transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-slate-300">Next</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
