import { Card, CardContent } from "@/components/ui/card";
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
import { CheckCircle2, Clock, Printer, Package, PartyPopper, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const visibleStatuses = [
  "PAYMENT_VERIFICATION_PENDING",
  "PAID",
  "PRINTING",
  "READY_FOR_PICKUP",
  "COMPLETED",
] as const;

const statusIcons: Record<(typeof visibleStatuses)[number], typeof Clock> = {
  PAYMENT_VERIFICATION_PENDING: Clock,
  PAID: CheckCircle2,
  PRINTING: Printer,
  READY_FOR_PICKUP: Package,
  COMPLETED: PartyPopper,
};

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.trackingTokenHash, hashTrackingToken(token)))
    .limit(1);
  if (!order) notFound();

  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.orderId, order.id))
    .orderBy(statusHistory.createdAt);

  const currentStepIndex = visibleStatuses.findIndex(
    (s) => s === order.status || history.some((h) => h.toStatus === s)
  );

  return (
    <SiteShell hideNav>
      <RealtimeOrders orderId={order.id} strategy="websocket" />
      <div className="mx-auto grid max-w-lg gap-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#003262] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Order header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Track Order</h1>
          <p className="mt-1 text-sm text-slate-500">
            Order #{order.id.slice(0, 8)} · {formatCurrency(Number(order.amount))}
          </p>
        </div>

        {/* Payment success banner */}
        {order.status !== "QUOTE_CREATED" &&
          order.status !== "PAYMENT_REJECTED" &&
          order.status !== "PAYMENT_VERIFICATION_PENDING" && (
            <div className="bg-[#238822]/10 border border-[#238822]/30 rounded-xl p-4 flex items-start gap-3">
              <div className="bg-[#238822] rounded-full p-1 mt-0.5 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#1a6619] text-sm">Payment Received</p>
                <p className="text-[#238822] text-xs mt-0.5 leading-relaxed">
                  Your payment of {formatCurrency(Number(order.amount))} was confirmed. We are now processing your order.
                </p>
              </div>
            </div>
          )}

        {/* Payment rejection banner */}
        {order.status === "PAYMENT_REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-red-500 rounded-full p-1 mt-0.5 shrink-0">
              <XCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-red-900 text-sm">Payment Failed</p>
              <p className="text-red-700 text-xs mt-0.5 leading-relaxed">
                Your payment could not be processed or timed out. Please try again to proceed.
              </p>
            </div>
          </div>
        )}

        {/* Awaiting payment card */}
        {(order.status === "QUOTE_CREATED" || order.status === "PAYMENT_REJECTED") && (
          <Card>
            <div className="bg-[#003262] rounded-t-xl px-5 py-3.5">
              <p className="font-bold text-white text-sm">Payment Required</p>
            </div>
            <CardContent className="grid gap-4 p-5">
              <div className="text-center py-2">
                <p className="text-3xl font-extrabold text-[#003262]">
                  {formatCurrency(Number(order.amount))}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Complete your payment to begin printing.
                </p>
              </div>
              <CheckoutButton orderId={order.id} token={token} />
            </CardContent>
          </Card>
        )}

        {/* Order progress card */}
        <Card>
          <div className="bg-[#003262] rounded-t-xl px-5 py-3.5">
            <p className="font-bold text-white text-sm">Order Progress</p>
          </div>
          <CardContent className="p-5 grid gap-0">
            {visibleStatuses.map((status, index) => {
              const reached =
                history.some((entry) => entry.toStatus === status) || order.status === status;
              const isLast = index === visibleStatuses.length - 1;
              const isCurrent = order.status === status;
              const Icon = statusIcons[status];

              return (
                <div key={status} className="flex gap-4">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        reached
                          ? isCurrent
                            ? "bg-[#003262] text-white shadow-md shadow-[#003262]/30"
                            : "bg-[#238822] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] mt-1 mb-1 rounded-full transition-colors ${
                          reached ? "bg-[#238822]/50" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div className={`pb-6 pt-1.5 ${isLast ? "pb-0" : ""}`}>
                    <p
                      className={`text-sm font-semibold ${
                        reached ? (isCurrent ? "text-[#003262]" : "text-slate-700") : "text-slate-400"
                      }`}
                    >
                      {statusLabels[status]}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-slate-500 mt-0.5">Current status</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Payment verification pending state */}
        {order.status === "PAYMENT_VERIFICATION_PENDING" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Verifying Payment</p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                We have received your payment details and are verifying them. This usually takes a few minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
