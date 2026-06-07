import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, statusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkOrderStatus } from "@/lib/phonepe";
import { getAppBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");

    if (!orderId || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const appUrl = getAppBaseUrl();
    const trackPageUrl = `${appUrl}/track/${token}`;

    // Verify payment status with PhonePe
    const statusData = await checkOrderStatus(orderId);
    
    // Status can be COMPLETED, FAILED, PENDING, etc.
    if (statusData.state === "COMPLETED") {
      // Update order status to PAID if it's not already
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      if (order && (order.status === "QUOTE_CREATED" || order.status === "PAYMENT_REJECTED" || order.status === "PAYMENT_VERIFICATION_PENDING")) {
        await db.transaction(async (tx) => {
          await tx
            .update(orders)
            .set({ status: "PAID", updatedAt: new Date() })
            .where(eq(orders.id, orderId));

          await tx.insert(statusHistory).values({
            id: crypto.randomUUID(),
            orderId: orderId,
            fromStatus: order.status,
            toStatus: "PAID",
            note: "Payment received successfully via PhonePe.",
          });
        });
      }
    } else if (statusData.state === "FAILED") {
      console.warn(`PhonePe payment failed for order ${orderId}: ${statusData.responseCode}`);
      
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (order && (order.status === "QUOTE_CREATED" || order.status === "PAYMENT_VERIFICATION_PENDING")) {
        await db.transaction(async (tx) => {
          await tx
            .update(orders)
            .set({ status: "PAYMENT_REJECTED", updatedAt: new Date() })
            .where(eq(orders.id, orderId));

          await tx.insert(statusHistory).values({
            id: crypto.randomUUID(),
            orderId: orderId,
            fromStatus: order.status,
            toStatus: "PAYMENT_REJECTED",
            note: `Payment failed: ${statusData.responseCode}`,
          });
        });
      }
    }
    // Redirect user back to the tracking page regardless of outcome
    // The tracking page will reflect the actual order status
    return NextResponse.redirect(trackPageUrl);
  } catch (error) {
    console.error("PhonePe callback error:", error);
    // Even on error, it's safer to send user back to the tracking page
    const token = req.nextUrl.searchParams.get("token");
    if (token) {
      return NextResponse.redirect(`${getAppBaseUrl()}/track/${token}`);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Optionally handle POST if PhonePe uses POST for standard redirect
export async function POST(req: NextRequest) {
  // If PhonePe POSTs form data back instead of GET, handle it the same way.
  // Generally, their redirect mode can be configured.
  // If we put redirectMode="REDIRECT" it's usually GET or POST.
  return GET(req);
}
