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

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin();
  const { status, page } = await searchParams;
  const validStatus = adminStatuses.find((item) => item === status);
  
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 20;

  // OPTIMIZATION: Run both queries concurrently to cut database latency in half
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
      .groupBy(orders.status)
  ]);

  const counts = Object.fromEntries(
    adminStatuses.map((item) => [item, countStats.find((c) => c.status === item)?.count ?? 0])
  );
  
  const currentCount = validStatus ? (counts[validStatus] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(currentCount / pageSize));

  return (
    <div className="grid gap-6">
      <RealtimeOrders />
      <div>
        <h1 className="text-2xl font-semibold text-stone-950">Orders</h1>
        <p className="mt-2 text-sm text-stone-600">Review payments, manage print progress, and inspect submitted files.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {adminStatuses.slice(0, 5).map((item) => (
          <Link key={item} href={`/admin/orders?status=${item}`}>
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10 hover:border-teal-200 border-stone-200/60 shadow-sm bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-semibold text-stone-950">{counts[item] ?? 0}</p>
                <p className="mt-1 text-xs text-stone-500 font-medium">{statusLabels[item]}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="border-stone-200/60 shadow-2xl shadow-stone-200/40 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="bg-stone-100/50 backdrop-blur-md border-b border-stone-200/60 p-2 sm:p-3">
          <nav className="flex overflow-x-auto space-x-1 sm:space-x-2 pb-1" aria-label="Order status tabs">
            <Link 
              className={`shrink-0 rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-all ${!validStatus ? 'bg-white text-teal-800 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'}`} 
              href="/admin/orders"
            >
              All Orders
            </Link>
            {adminStatuses.map((item) => (
              <Link 
                key={item} 
                className={`shrink-0 rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-all ${validStatus === item ? 'bg-white text-teal-800 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'}`} 
                href={`/admin/orders?status=${item}`}
              >
                {statusLabels[item]}
              </Link>
            ))}
          </nav>
        </div>
        <CardContent className="p-5 bg-stone-50/30">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length > 0 ? (
              rows.map((order) => (
                <Card key={order.id} className="relative overflow-hidden border-stone-200/60 shadow-sm shadow-stone-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10 hover:border-teal-300 bg-white/95 flex flex-col group">
                  <Link href={`/admin/orders/${order.id}`} className="absolute inset-0 z-0" aria-label={`View order ${order.id}`} />
                  <CardHeader className="pb-3 z-10 pointer-events-none bg-gradient-to-b from-stone-50/50 to-transparent">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base text-teal-700 group-hover:text-teal-600 transition-colors">#{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription className="mt-1 font-medium text-stone-900">{order.customerName}</CardDescription>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 uppercase tracking-wider border border-stone-200/50 shadow-sm">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm grid gap-2 z-10 pointer-events-none flex-1">
                    <div className="rounded-md bg-teal-50/50 p-2.5 border border-teal-100/50 mb-1">
                      <p className="text-stone-600 flex items-center justify-between">
                        <span className="text-stone-500 font-medium text-xs uppercase tracking-wider">Exact Amount</span> 
                        <span className="font-bold text-teal-800 text-base">{formatCurrency(Number(order.amount))}</span>
                      </p>
                    </div>
                    <p className="text-stone-600 flex items-center justify-between">
                      <span className="text-stone-400">Phone</span> 
                      <span className="font-medium text-stone-800">{order.customerPhone}</span>
                    </p>
                    <p className="text-stone-600 flex items-center justify-between">
                      <span className="text-stone-400">Email</span> 
                      <span className="font-medium text-stone-800 truncate max-w-[140px]" title={order.customerEmail}>{order.customerEmail}</span>
                    </p>
                    <p className="text-xs text-stone-400 mt-2 pt-2 border-t border-stone-100 border-dashed">
                      Placed: {order.createdAt.toLocaleString("en-IN")}
                    </p>
                  </CardContent>
                  {order.status !== "COMPLETED" && order.status !== "PAYMENT_REJECTED" && (
                    <CardFooter className="z-10 bg-stone-50/50 border-t border-stone-100 p-3 flex gap-2">
                      {order.status === "PAYMENT_VERIFICATION_PENDING" && (
                        <>
                          <form action={transitionOrder} className="flex-1">
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="toStatus" value="PAID" />
                            <Button type="submit" className="w-full h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">Approve Payment</Button>
                          </form>
                          <form action={transitionOrder} className="flex-1">
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="toStatus" value="PAYMENT_REJECTED" />
                            <Button type="submit" className="w-full h-8 text-xs bg-transparent border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all hover:-translate-y-0.5 shadow-sm">Reject</Button>
                          </form>
                        </>
                      )}
                      {order.status === "PAID" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="PRINTING" />
                          <Button type="submit" className="w-full h-8 text-xs bg-stone-800 hover:bg-stone-900 text-white shadow-sm transition-all hover:-translate-y-0.5">Mark as Printing</Button>
                        </form>
                      )}
                      {order.status === "PRINTING" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="READY_FOR_PICKUP" />
                          <Button type="submit" className="w-full h-8 text-xs bg-stone-800 hover:bg-stone-900 text-white shadow-sm transition-all hover:-translate-y-0.5">Mark Ready for Pickup</Button>
                        </form>
                      )}
                      {order.status === "READY_FOR_PICKUP" && (
                        <form action={transitionOrder} className="w-full">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="toStatus" value="COMPLETED" />
                          <Button type="submit" className="w-full h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">Mark as Completed</Button>
                        </form>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-stone-500 bg-white/60 rounded-xl border-2 border-stone-200 border-dashed backdrop-blur-sm">
                No orders found.
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 mt-6 pt-5 px-2 text-sm text-stone-600 font-medium">
              <div>
                Page {pageNum} of {totalPages}
              </div>
              <div className="flex gap-2">
                {pageNum > 1 ? (
                  <Link href={`/admin/orders?${validStatus ? `status=${validStatus}&` : ""}page=${pageNum - 1}`} className="px-3 py-1.5 rounded-md hover:bg-teal-50 text-stone-600 hover:text-teal-700 transition-colors">
                    Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-stone-300">Previous</span>
                )}
                {pageNum < totalPages ? (
                  <Link href={`/admin/orders?${validStatus ? `status=${validStatus}&` : ""}page=${pageNum + 1}`} className="px-3 py-1.5 rounded-md hover:bg-teal-50 text-stone-600 hover:text-teal-700 transition-colors">
                    Next
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-stone-300">Next</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
