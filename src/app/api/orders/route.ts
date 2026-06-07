import { files, fileOptions, orders, statusHistory } from "@/db/schema";
import { db } from "@/db";
import { calculatePageSplit, calculateQuote } from "@/lib/quote";
import { getDefaultShop } from "@/lib/shop";
import { createTrackingToken, hashTrackingToken } from "@/lib/tokens";
import { fileMetadataSchema, printOptionsSchema, customerSchema } from "@/lib/validation";
import { sendOrderEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";

const createOrderSchema = z.object({
  customer: customerSchema,
  files: z.array(fileMetadataSchema).min(1).max(10),
  options: z.array(printOptionsSchema).min(1).max(10)
});

export async function POST(request: Request) {
  const parsed = createOrderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shop = await getDefaultShop();
  // page split is handled per-file during fileOptions insertion
  const quote = calculateQuote(parsed.data.options, shop);
  const trackingToken = createTrackingToken();
  const trackingTokenHash = hashTrackingToken(trackingToken);

  const [order] = await db
    .insert(orders)
    .values({
      shopId: shop.id,
      customerName: parsed.data.customer.name,
      customerPhone: parsed.data.customer.phone,
      customerEmail: parsed.data.customer.email || null,
      trackingTokenHash,
      amount: quote.total.toFixed(2),
      quote,
      status: "QUOTE_CREATED"
    })
    .returning();

  await db.insert(files).values(
    parsed.data.files.map((file) => ({
      id: file.id,
      orderId: order.id,
      originalName: file.originalName,
      storagePath: file.storagePath,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      pageCount: file.pageCount
    }))
  );

  await db.insert(fileOptions).values(
    parsed.data.options.map((opt) => {
      const split = calculatePageSplit(opt);
      return {
        fileId: opt.fileId,
        paperSize: opt.paperSize,
        copies: opt.copies,
        binding: opt.binding,
        lamination: opt.lamination,
        entireDocumentColor: opt.entireDocumentColor,
        colorPageRanges: opt.colorPageRanges || null,
        totalPages: split.totalPages,
        colorPages: split.colorPages,
        bwPages: split.bwPages
      };
    })
  );

  await db.insert(statusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: "QUOTE_CREATED",
    note: "Order submitted"
  });

  await sendOrderEmail({
    to: parsed.data.customer.email,
    subject: "PrintFloww order submitted",
    html: `<p>Your print order has been submitted. Track it at ${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingToken}</p>`
  });

  return NextResponse.json({
    orderId: order.id,
    trackingToken,
    paymentUrl: `/payment?order=${order.id}&token=${trackingToken}`
  });
}
