import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { createUpiPaymentLink } from "@/lib/payment";
import { hashTrackingToken } from "@/lib/tokens";
import { formatCurrency } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { markPaid } from "./actions";

export default async function PaymentPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const params = await searchParams;
  if (!params.order || !params.token) notFound();

  const [row] = await db
    .select({ order: orders, shop: shops })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(and(eq(orders.id, params.order), eq(orders.trackingTokenHash, hashTrackingToken(params.token))))
    .limit(1);

  if (!row) notFound();

  const amount = Number(row.order.amount);
  const upiLink = createUpiPaymentLink({
    upiId: row.shop.upiId,
    shopName: row.shop.name,
    amount,
    note: `PrintFloww ${row.order.id.slice(0, 8)}`
  });
  const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 280 });

  return (
    <SiteShell hideNav>
      <div className="mx-auto grid max-w-xl gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Pay with UPI</h1>
          <p className="mt-2 text-sm text-stone-600">Amount is prefilled in the payment link.</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-stone-950">{row.shop.name}</p>
                <p className="text-sm text-stone-500">{row.shop.upiId}</p>
              </div>
              <p className="text-xl font-semibold text-stone-950">{formatCurrency(amount)}</p>
            </div>
          </CardHeader>
          <CardContent className="grid justify-items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="UPI QR code" className="h-[280px] w-[280px]" />
            <a className="text-sm font-medium text-teal-700 hover:underline" href={upiLink}>
              Open UPI App
            </a>
            <form action={markPaid}>
              <input type="hidden" name="orderId" value={row.order.id} />
              <input type="hidden" name="token" value={params.token} />
              <Button type="submit" disabled={row.order.status !== "QUOTE_CREATED"}>
                <CheckCircle2 className="h-4 w-4" />
                {row.order.status === "QUOTE_CREATED" ? "I've Paid" : "Payment Submitted"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
