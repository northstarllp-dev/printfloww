"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText, ChevronDown, ChevronUp, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Draft = {
  customer: { name: string; phone: string; email?: string };
  files: Array<{ id: string; originalName: string; storagePath: string; mimeType: string; sizeBytes: number; pageCount: number | null }>;
};

type FileOptions = {
  paperSize: "A4" | "A3";
  copies: number;
  binding: "NONE" | "SPIRAL";
  lamination: boolean;
  printMode: "BW" | "COLOR" | "CUSTOM";
  colorPageRanges: string;
};

export function QuoteForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<{ lineItems: Array<{ label: string; amount: number }>; total: number } | null>(null);
  const [split, setSplit] = useState({ totalPages: 1, colorPages: 0, bwPages: 1 });
  const [optionsMap, setOptionsMap] = useState<Record<string, FileOptions>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = sessionStorage.getItem("printfloww:draft");
    if (!raw) {
      router.replace("/upload");
    } else {
      const parsedDraft = JSON.parse(raw) as Draft;
      setDraft(parsedDraft);

      const initial: Record<string, FileOptions> = {};
      parsedDraft.files.forEach((f) => {
        initial[f.id] = {
          paperSize: "A4",
          copies: 1,
          binding: "NONE",
          lamination: false,
          printMode: "BW",
          colorPageRanges: "",
        };
      });
      setOptionsMap(initial);

      if (parsedDraft.files.length > 0) {
        setExpandedFiles(new Set([parsedDraft.files[0].id]));
      }
    }
  }, [router]);

  useEffect(() => {
    if (!draft || Object.keys(optionsMap).length !== draft.files.length) return;

    const optionsArray = draft.files.map((f) => {
      const opt = optionsMap[f.id];
      return {
        fileId: f.id,
        paperSize: opt.paperSize,
        copies: opt.copies,
        binding: opt.binding,
        lamination: opt.lamination,
        entireDocumentColor: opt.printMode === "COLOR",
        colorPageRanges: opt.printMode === "CUSTOM" ? opt.colorPageRanges : "",
        totalPages: f.pageCount || 1,
      };
    });

    const controller = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(optionsArray),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setSplit(data.split);
        setQuote(data.quote);
        setError(null);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuote(null);
      });

    return () => controller.abort();
  }, [draft, optionsMap]);

  function updateOption<K extends keyof FileOptions>(fileId: string, key: K, value: FileOptions[K]) {
    setOptionsMap((prev) => ({
      ...prev,
      [fileId]: { ...prev[fileId], [key]: value },
    }));
  }

  function toggleExpanded(fileId: string) {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const optionsArray = draft.files.map((f) => {
        const opt = optionsMap[f.id];
        return {
          fileId: f.id,
          paperSize: opt.paperSize,
          copies: opt.copies,
          binding: opt.binding,
          lamination: opt.lamination,
          entireDocumentColor: opt.printMode === "COLOR",
          colorPageRanges: opt.printMode === "CUSTOM" ? opt.colorPageRanges : "",
          totalPages: f.pageCount || 1,
        };
      });

      const payload = { ...draft, options: optionsArray };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Could not create order. Check print options and try again.");
      const created = await response.json();
      sessionStorage.removeItem("printfloww:draft");

      const initRes = await fetch("/api/payment/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: created.orderId, token: created.trackingToken }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.redirectUrl) {
        router.push(`/track/${created.trackingToken}`);
        throw new Error(initData.error || "Failed to initiate PhonePe session.");
      }

      window.location.href = initData.redirectUrl;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quote failed.");
      setIsSubmitting(false);
    }
  }

  if (!draft || Object.keys(optionsMap).length === 0) return null;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
      {/* File option cards */}
      <div className="grid gap-3">
        {draft.files.map((file) => {
          const opt = optionsMap[file.id];
          if (!opt) return null;
          const isExpanded = expandedFiles.has(file.id);

          return (
            <Card key={file.id} className="overflow-hidden">
              {/* File header (accordion toggle) */}
              <button
                type="button"
                onClick={() => toggleExpanded(file.id)}
                className="w-full text-left bg-slate-50 px-4 py-3.5 hover:bg-slate-100 transition-colors flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003262]/30 rounded-t-xl"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-[#003262]/10 p-2 rounded-lg shrink-0">
                    <FileText className="h-4 w-4 text-[#003262]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate text-sm">{file.originalName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {file.pageCount ? `${file.pageCount} pages` : "Unknown pages"} ·{" "}
                      {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <CardContent className="grid gap-4 sm:grid-cols-2 p-4 sm:p-5 border-t border-slate-100">
                  <Field label="Paper Size">
                    <Select
                      value={opt.paperSize}
                      onChange={(e) => updateOption(file.id, "paperSize", e.target.value as "A4" | "A3")}
                    >
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                    </Select>
                  </Field>
                  <Field label="Copies">
                    <Input
                      type="number"
                      min={1}
                      value={opt.copies}
                      onChange={(e) => updateOption(file.id, "copies", Number(e.target.value))}
                      required
                    />
                  </Field>
                  <Field label="Binding">
                    <Select
                      value={opt.binding}
                      onChange={(e) => updateOption(file.id, "binding", e.target.value as "NONE" | "SPIRAL")}
                    >
                      <option value="NONE">None</option>
                      <option value="SPIRAL">Spiral Bound</option>
                    </Select>
                  </Field>
                  <Field label="Lamination">
                    <Select
                      value={String(opt.lamination)}
                      onChange={(e) => updateOption(file.id, "lamination", e.target.value === "true")}
                    >
                      <option value="false">No Lamination</option>
                      <option value="true">Yes, Laminate</option>
                    </Select>
                  </Field>
                  <Field label="Print Mode">
                    <Select
                      value={opt.printMode}
                      onChange={(e) => updateOption(file.id, "printMode", e.target.value as "BW" | "COLOR" | "CUSTOM")}
                    >
                      <option value="BW">Black &amp; White</option>
                      <option value="COLOR">Full Color</option>
                      <option value="CUSTOM">Custom Color Pages</option>
                    </Select>
                  </Field>
                  {opt.printMode === "CUSTOM" && (
                    <Field label="Color Page Ranges" hint="Example: 1-3, 5, 8">
                      <Input
                        value={opt.colorPageRanges}
                        onChange={(e) => updateOption(file.id, "colorPageRanges", e.target.value)}
                        placeholder="e.g. 1-5, 10"
                        required
                      />
                    </Field>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Order summary — sticky on desktop, shown above submit on mobile */}
      <div className="lg:sticky lg:top-20">
        <Card>
          <div className="bg-[#003262] rounded-t-xl px-5 py-3.5 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-white" />
            <h2 className="font-bold text-white text-sm">Order Summary</h2>
          </div>
          <CardContent className="grid gap-3 p-4 sm:p-5 text-sm">
            {/* Page breakdown */}
            <div className="grid gap-1.5 pb-3 border-b border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Total pages</span>
                <strong className="text-slate-900">{split.totalPages}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Color pages</span>
                <strong className="text-slate-900">{split.colorPages}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>B&amp;W pages</span>
                <strong className="text-slate-900">{split.bwPages}</strong>
              </div>
            </div>

            {/* Line items */}
            {quote?.lineItems.map((item) => (
              <div key={item.label} className="flex justify-between text-slate-600">
                <span>{item.label}</span>
                <strong className="text-slate-900">{formatCurrency(item.amount)}</strong>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-xl font-extrabold text-[#003262]">
                {formatCurrency(quote?.total ?? 0)}
              </span>
            </div>

            {error ? (
              <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 text-xs">{error}</p>
            ) : null}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={isSubmitting || !quote}
              className="w-full mt-1"
            >
              <CreditCard className="h-5 w-5" />
              {isSubmitting ? "Redirecting…" : "Pay with PhonePe"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
