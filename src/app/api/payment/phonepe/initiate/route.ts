import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashTrackingToken } from "@/lib/tokens";
import { createPayment } from "@/lib/phonepe";
import { getAppBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, token } = body;

    if (!orderId || !token) {
      return NextResponse.json({ error: "Missing orderId or token" }, { status: 400 });
    }

    // Verify order and token
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.trackingTokenHash, hashTrackingToken(token))))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found or invalid token" }, { status: 404 });
    }

    if (order.status !== "QUOTE_CREATED" && order.status !== "PAYMENT_REJECTED") {
      return NextResponse.json({ error: "Order is not in a state to be paid" }, { status: 400 });
    }

    const amount = Number(order.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    // PhonePe expects amount in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);
    
    // Build the absolute callback URL (e.g. https://yourdomain.com/api/payment/phonepe/callback?orderId=...&token=...)
    const appUrl = getAppBaseUrl();
    const redirectUrl = `${appUrl}/api/payment/phonepe/callback?orderId=${orderId}&token=${token}`;

    const paymentResponse = await createPayment({
      orderId: order.id,
      amountInPaise,
      redirectUrl,
    });

    if (paymentResponse?.redirectUrl) {
      return NextResponse.json({ redirectUrl: paymentResponse.redirectUrl });
    } else {
      console.error("PhonePe Initiation failed: Missing redirectUrl in response", paymentResponse);
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
    }
  } catch (error) {
    console.error("PhonePe payment initiation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
