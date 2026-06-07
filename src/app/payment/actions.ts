"use server";

import { db } from "@/db";
import { orders, statusHistory } from "@/db/schema";
import { hashTrackingToken } from "@/lib/tokens";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function markPaid(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const token = String(formData.get("token") ?? "");
  const tokenHash = hashTrackingToken(token);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.trackingTokenHash, tokenHash)))
    .limit(1);

  if (!order || order.status !== "QUOTE_CREATED") {
    redirect(`/track/${token}`);
  }

  await db
    .update(orders)
    .set({ status: "PAYMENT_VERIFICATION_PENDING", updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  await db.insert(statusHistory).values({
    orderId: order.id,
    fromStatus: order.status,
    toStatus: "PAYMENT_VERIFICATION_PENDING",
    note: "Customer clicked I've Paid"
  });

  redirect(`/track/${token}`);
}
