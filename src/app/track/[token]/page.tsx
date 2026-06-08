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
import { CheckoutButton } from "@/components/checkout-button";
import { CheckCircle2 } from "lucide-react";

const visibleStatuses = [
  "PAYMENT_VERIFICATION_PENDING",
  "PAID",
  "PRINTING",
  "READY_FOR_PICKUP",
  "COMPLETED"
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
      <RealtimeOrders orderId={order.id} strategy="websocket" />
      <div className="mx-auto grid max-w-3xl gap-5 mt-10">
        
        {order.status !== "QUOTE_CREATED" && order.status !== "PAYMENT_REJECTED" && order.status !== "PAYMENT_VERIFICATION_PENDING" && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 flex items-start gap-4">
            <div className="bg-teal-600 rounded-full p-1 mt-0.5 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-teal-900">Payment Successful</h3>
              <p className="text-teal-800 text-sm mt-1">
                Your payment of {formatCurrency(Number(order.amount))} was received. We are now processing your order.
                {order.customerEmail && " A receipt has been sent to your email. You must show that email to the shop during pickup."}
              </p>
            </div>
          </div>
        )}

        {order.status === "QUOTE_CREATED" && (
          <Card className="border-stone-200/60 shadow-sm mb-2 bg-stone-50/50">
            <CardContent className="grid justify-items-center gap-4 pt-6 pb-6">
              <div className="text-center">
                <p className="text-stone-900 font-semibold">Awaiting Payment</p>
                <p className="text-sm text-stone-500 mt-1">Please complete your payment of {formatCurrency(Number(order.amount))} to begin printing.</p>
              </div>
              <CheckoutButton orderId={order.id} token={token} />
            </CardContent>
          </Card>
        )}

        {order.status === "PAYMENT_REJECTED" && (
          <Card className="border-red-200/60 shadow-sm mb-2 bg-red-50/50">
            <CardContent className="grid justify-items-center gap-4 pt-6 pb-6">
              <div className="text-center">
                <p className="text-red-900 font-semibold">Payment Failed</p>
                <p className="text-sm text-red-700 mt-1">Your payment could not be processed or timed out. Please try again to proceed with printing.</p>
              </div>
              <CheckoutButton orderId={order.id} token={token} />
            </CardContent>
          </Card>
        )}

        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Track Order</h1>
          <p className="mt-2 text-sm text-stone-600">
            Order PF-{order.orderNumber} &middot; Tracking Code: <span className="font-mono">{order.trackingTokenPrefix}</span> &middot; {formatCurrency(Number(order.amount))}
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
