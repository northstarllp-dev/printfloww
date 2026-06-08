import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, statusHistory, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkOrderStatus } from "@/lib/phonepe";
import { getAppBaseUrl } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

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
    
    // Always update the specific payment record 
    await db
      .update(payments)
      .set({
        status: statusData.state || "UNKNOWN",
        providerTransactionId: statusData.transactionId || null,
        updatedAt: new Date()
      })
      .where(eq(payments.orderId, orderId));
      
    // Status can be COMPLETED, FAILED, PENDING, etc.
    if (statusData.state === "COMPLETED") {
      // Update order status to PAID if it's not already
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      let newlyPaid = false;
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
        newlyPaid = true;

        try {
          const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          await supabase.channel(`realtime-order-${orderId}`).send({
            type: "broadcast",
            event: "status_update",
            payload: { status: "PAID" }
          });
        } catch (err) {
          console.error("Failed to broadcast PAID status:", err);
        }
      }

      // Fire off emails concurrently without blocking the callback
      if (newlyPaid && order) {
        // Dynamic import to avoid module issues if unused elsewhere
        const { sendCustomerSuccessEmail, sendShopNewOrderEmail } = await import("@/lib/mail");
        const { shops, files } = await import("@/db/schema");
        
        // Fetch shop and file details
        const [shop] = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);
        const uploadedFiles = await db.select().from(files).where(eq(files.orderId, order.id));
        
        // Send Customer Email if they provided one
        if (order.customerEmail) {
          sendCustomerSuccessEmail({
            to: order.customerEmail,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            trackingToken: token,
          }).catch(console.error);
        }

        // Send Shop Admin Email if shop has an email configured
        if (shop && shop.email) {
          sendShopNewOrderEmail({
            shopEmail: shop.email,
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || "",
            amount: Number(order.amount),
            fileCount: uploadedFiles.length,
          }).catch(console.error);
        }
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

        try {
          const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          await supabase.channel(`realtime-order-${orderId}`).send({
            type: "broadcast",
            event: "status_update",
            payload: { status: "PAYMENT_REJECTED" }
          });
        } catch (err) {
          console.error("Failed to broadcast PAYMENT_REJECTED status:", err);
        }
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
