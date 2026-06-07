"use server";

import { db } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { orders, statusHistory } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { canTransition } from "@/lib/status";
import { sendOrderEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function transitionOrder(formData: FormData) {
  const { user } = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "");

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !canTransition(order.status, toStatus)) return;

  await db.update(orders).set({ status: toStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));
  await db.insert(statusHistory).values({
    orderId: order.id,
    fromStatus: order.status,
    toStatus,
    note: note || null,
    actorId: user.id
  });

  if (toStatus === "PAID") {
    await sendOrderEmail({ to: order.customerEmail, subject: "Payment approved", html: "<p>Your payment has been approved.</p>" });
  }
  if (toStatus === "READY_FOR_PICKUP") {
    await sendOrderEmail({ to: order.customerEmail, subject: "Order ready for pickup", html: "<p>Your print order is ready for pickup.</p>" });
  }
  if (toStatus === "COMPLETED") {
    await sendOrderEmail({ to: order.customerEmail, subject: "Order completed", html: "<p>Your print order is complete.</p>" });
  }

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
}
