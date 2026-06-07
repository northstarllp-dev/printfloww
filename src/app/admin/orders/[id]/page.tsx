import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { db } from "@/db";
import { files, orderOptions, orders, statusHistory } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { allowedTransitions, statusLabels } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { transitionOrder } from "./actions";

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  // OPTIMIZATION: Fetch all related order data concurrently
  const [
    [order],
    [options],
    uploadedFiles,
    history
  ] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderOptions).where(eq(orderOptions.orderId, id)).limit(1),
    db.select().from(files).where(eq(files.orderId, id)),
    db.select().from(statusHistory).where(eq(statusHistory.orderId, id)).orderBy(statusHistory.createdAt)
  ]);

  if (!order) notFound();

  const supabase = createSupabaseAdminClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "printfloww-private";

  let signedUrlsData = null;
  if (uploadedFiles.length > 0) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(
      uploadedFiles.map((f) => f.storagePath),
      300
    );
    signedUrlsData = data;
  }
  const filesWithUrls = uploadedFiles.map((file) => {
    const match = signedUrlsData?.find((s) => s.path === file.storagePath);
    return { ...file, signedUrl: match?.signedUrl };
  });
  const nextStatuses = allowedTransitions[order.status] ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-950">Order {order.id.slice(0, 8)}</h1>
        <p className="mt-2 text-sm text-stone-600">Tracking link is available only to the customer token holder.</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Card className="h-full">
              <CardHeader><h2 className="font-semibold">Customer Details</h2></CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p><strong>Name:</strong> {order.customerName}</p>
                <p><strong>Phone:</strong> {order.customerPhone}</p>
                <p><strong>Email:</strong> {order.customerEmail || "Not provided"}</p>
                <p><strong>Amount:</strong> {formatCurrency(Number(order.amount))}</p>
                <p><strong>Status:</strong> {statusLabels[order.status]}</p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader><h2 className="font-semibold">Print Options</h2></CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {options ? (
                  <>
                    <p><strong>Paper:</strong> {options.paperSize}</p>
                    <p><strong>Copies:</strong> {options.copies}</p>
                    <p><strong>Binding:</strong> {options.binding === "SPIRAL" ? "Spiral" : "None"}</p>
                    <p><strong>Lamination:</strong> {options.lamination ? "Yes" : "No"}</p>
                    <p><strong>Color pages:</strong> {options.entireDocumentColor ? "Entire document" : options.colorPageRanges || "None"}</p>
                    <p><strong>Split:</strong> {options.colorPages} color, {options.bwPages} black & white</p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><h2 className="font-semibold">Uploaded Files</h2></CardHeader>
            <CardContent className="grid gap-3">
              {filesWithUrls.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-4 rounded-md border border-stone-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-stone-950">{file.originalName}</p>
                    <p className="text-stone-500">{file.pageCount ?? "Unknown"} pages · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {file.signedUrl ? <a className="font-medium text-teal-700" href={file.signedUrl}>Open</a> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-5">
          <Card>
            <CardHeader><h2 className="font-semibold">Quote Details</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {order.quote.lineItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
              <div className="border-t border-stone-200 pt-2 flex justify-between text-base">
                <span>Total</span>
                <strong>{formatCurrency(order.quote.total)}</strong>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Status Management</h2></CardHeader>
            <CardContent className="grid gap-3">
              {nextStatuses.length ? (
                nextStatuses.map((status) => (
                  <form key={status} action={transitionOrder} className="grid gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="toStatus" value={status} />
                    <Button type="submit">{status === "PAID" ? "Approve Payment" : status === "PAYMENT_REJECTED" ? "Reject Payment" : `Mark ${statusLabels[status]}`}</Button>
                  </form>
                ))
              ) : (
                <p className="text-sm text-stone-500">No further transitions available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Status History</h2></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {history.map((entry) => (
                <div key={entry.id} className="border-b border-stone-100 pb-2 last:border-0">
                  <p className="font-medium">{statusLabels[entry.toStatus]}</p>
                  <p className="text-xs text-stone-500">{entry.createdAt.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
