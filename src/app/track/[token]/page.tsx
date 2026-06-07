import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/db";
import { orders, statusHistory } from "@/db/schema";
import { statusLabels } from "@/lib/status";
import { hashTrackingToken } from "@/lib/tokens";
import { formatCurrency } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RealtimeOrders } from "@/components/realtime-orders";

const visibleStatuses = [
  "PAYMENT_VERIFICATION_PENDING",
  "PAID",
  "PRINTING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "PAYMENT_REJECTED"
] as const;

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.trackingTokenHash, hashTrackingToken(token))).limit(1);
  if (!order) notFound();

  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.orderId, order.id))
    .orderBy(statusHistory.createdAt);

  return (
    <SiteShell hideNav>
      <RealtimeOrders orderId={order.id} strategy="polling" intervalMs={5000} />
      <div className="mx-auto grid max-w-3xl gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Track Order</h1>
          <p className="mt-2 text-sm text-stone-600">
            Order {order.id.slice(0, 8)} · {formatCurrency(Number(order.amount))}
          </p>
        </div>
        <Card>
          <CardHeader>
            <p className="font-semibold text-stone-950">Current status: {statusLabels[order.status]}</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {visibleStatuses.map((status) => {
              const reached = history.some((entry) => entry.toStatus === status) || order.status === status;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${reached ? "bg-teal-700" : "bg-stone-300"}`} />
                  <span className={reached ? "font-medium text-stone-950" : "text-stone-500"}>{statusLabels[status]}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
