"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Draft = {
  customer: { name: string; phone: string; email?: string };
  files: Array<{ id: string; originalName: string; storagePath: string; mimeType: string; sizeBytes: number; pageCount: number | null }>;
};

export function QuoteForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entireColor, setEntireColor] = useState(false);
  const [ranges, setRanges] = useState("");
  const [quote, setQuote] = useState<{ lineItems: Array<{ label: string; amount: number }>; total: number } | null>(null);
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [binding, setBinding] = useState<"NONE" | "SPIRAL">("NONE");
  const [lamination, setLamination] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("printfloww:draft");
    if (!raw) router.replace("/upload");
    else setDraft(JSON.parse(raw));
  }, [router]);

  const totalPages = useMemo(() => {
    if (!draft) return 1;
    return draft.files.reduce((sum, file) => sum + (file.pageCount ?? 1), 0);
  }, [draft]);

  const [split, setSplit] = useState({ totalPages: 1, colorPages: 0, bwPages: 1 });

  useEffect(() => {
    if (!draft) return;
    const controller = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        paperSize,
        copies,
        binding,
        lamination,
        entireDocumentColor: entireColor,
        colorPageRanges: ranges,
        totalPages
      })
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setSplit(data.split);
        setQuote(data.quote);
      })
      .catch(() => {
        setQuote(null);
        setSplit({ totalPages, colorPages: 0, bwPages: totalPages });
      });

    return () => controller.abort();
  }, [binding, copies, draft, entireColor, lamination, paperSize, ranges, totalPages]);

  async function onSubmit(formData: FormData) {
    if (!draft) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...draft,
        options: {
          paperSize: formData.get("paperSize"),
          copies: formData.get("copies"),
          binding: formData.get("binding"),
          lamination: formData.get("lamination") === "true",
          entireDocumentColor: formData.get("entireDocumentColor") === "true",
          colorPageRanges: formData.get("colorPageRanges"),
          totalPages
        }
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Could not create order. Check print options and try again.");
      const created = await response.json();
      sessionStorage.removeItem("printfloww:draft");
      router.push(created.paymentUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quote failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!draft) return null;

  return (
    <form action={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-950">Files</h2>
          </CardHeader>
          <CardContent className="grid gap-3">
            {draft.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-4 rounded-md border border-stone-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-stone-950">{file.originalName}</p>
                  <p className="text-stone-500">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <span className="text-stone-700">{file.pageCount ? `${file.pageCount} pages` : "Page count unknown"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-950">Print Options</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Paper Size">
              <Select name="paperSize" value={paperSize} onChange={(event) => setPaperSize(event.target.value as "A4" | "A3")}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </Select>
            </Field>
            <Field label="Copies">
              <Input name="copies" type="number" min={1} value={copies} onChange={(event) => setCopies(Number(event.target.value))} required />
            </Field>
            <Field label="Binding">
              <Select name="binding" value={binding} onChange={(event) => setBinding(event.target.value as "NONE" | "SPIRAL")}>
                <option value="NONE">None</option>
                <option value="SPIRAL">Spiral</option>
              </Select>
            </Field>
            <Field label="Lamination">
              <Select name="lamination" value={String(lamination)} onChange={(event) => setLamination(event.target.value === "true")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
            <Field label="Color Printing">
              <Select name="entireDocumentColor" value={String(entireColor)} onChange={(event) => setEntireColor(event.target.value === "true")}>
                <option value="true">Entire document color</option>
                <option value="false">Specific color pages</option>
              </Select>
            </Field>
            <Field label="Specific Color Pages" hint="Example: 1-3,5,8">
              <Input name="colorPageRanges" value={ranges} onChange={(event) => setRanges(event.target.value)} disabled={entireColor} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <h2 className="font-semibold text-stone-950">Page Split</h2>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between"><span>Total pages</span><strong>{split.totalPages}</strong></div>
          <div className="flex justify-between"><span>Color pages</span><strong>{split.colorPages}</strong></div>
          <div className="flex justify-between"><span>Black & white pages</span><strong>{split.bwPages}</strong></div>
          <div className="my-2 border-t border-stone-200" />
          {quote?.lineItems.map((item) => (
            <div key={item.label} className="flex justify-between text-stone-700">
              <span>{item.label}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
          <div className="flex justify-between text-base text-stone-950">
            <span>Total</span>
            <strong>{formatCurrency(quote?.total ?? 0)}</strong>
          </div>
          {error ? <p className="text-red-700">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            <CreditCard className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Proceed to Payment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
