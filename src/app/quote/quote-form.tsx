"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Draft = {
  customer: { name: string; phone: string; email?: string };
  files: Array<{ id: string; originalName: string; storagePath: string; mimeType: string; sizeBytes: number; pageCount: number | null }>;
  shopId?: string;
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
      parsedDraft.files.forEach(f => {
        initial[f.id] = {
          paperSize: "A4",
          copies: 1,
          binding: "NONE",
          lamination: false,
          printMode: "BW",
          colorPageRanges: ""
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
    
    const optionsArray = draft.files.map(f => {
      const opt = optionsMap[f.id];
      return {
        fileId: f.id,
        paperSize: opt.paperSize,
        copies: opt.copies,
        binding: opt.binding,
        lamination: opt.lamination,
        entireDocumentColor: opt.printMode === "COLOR",
        colorPageRanges: opt.printMode === "CUSTOM" ? opt.colorPageRanges : "",
        totalPages: f.pageCount || 1
      };
    });

    const controller = new AbortController();
    fetch(`/api/quote?shopId=${draft.shopId || ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(optionsArray)
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
    setOptionsMap(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], [key]: value }
    }));
  }

  function toggleExpanded(fileId: string) {
    setExpandedFiles(prev => {
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
      const optionsArray = draft.files.map(f => {
        const opt = optionsMap[f.id];
        return {
          fileId: f.id,
          paperSize: opt.paperSize,
          copies: opt.copies,
          binding: opt.binding,
          lamination: opt.lamination,
          entireDocumentColor: opt.printMode === "COLOR",
          colorPageRanges: opt.printMode === "CUSTOM" ? opt.colorPageRanges : "",
          totalPages: f.pageCount || 1
        };
      });

      const payload = {
        ...draft,
        options: optionsArray
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Could not create order. Check print options and try again.");
      const created = await response.json();
      sessionStorage.removeItem("printfloww:draft");

      const initRes = await fetch("/api/payment/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: created.orderId,
          token: created.trackingToken,
        }),
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
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        {draft.files.map((file) => {
          const opt = optionsMap[file.id];
          if (!opt) return null;
          
          const isExpanded = expandedFiles.has(file.id);

          return (
            <Card key={file.id} className="overflow-hidden border-stone-200/60 shadow-sm transition-all">
              <CardHeader className="p-0 border-b border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleExpanded(file.id)}
                  className="w-full text-left bg-stone-50/80 p-4 sm:px-6 hover:bg-stone-100/80 transition-colors flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-600/50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-white p-2 rounded border border-stone-200 shadow-sm shrink-0">
                      <FileText className="h-4 w-4 text-stone-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-900 truncate">{file.originalName}</h3>
                      <p className="text-xs text-stone-500 mt-0.5 sm:hidden">{file.pageCount ? `${file.pageCount} pages` : "Unknown pages"} · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-stone-500 text-sm whitespace-nowrap bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-sm hidden sm:inline-block">
                      {file.pageCount ? `${file.pageCount} pages` : "Unknown pages"}
                    </span>
                    <div className="p-1 text-stone-400 hover:text-stone-600">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </button>
              </CardHeader>
              {isExpanded && (
                <CardContent className="grid gap-4 md:grid-cols-2 p-4 sm:px-6 sm:py-5 bg-white">
                <Field label="Paper Size">
                  <Select value={opt.paperSize} onChange={(e) => updateOption(file.id, "paperSize", e.target.value as any)}>
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                  </Select>
                </Field>
                <Field label="Copies">
                  <Input type="number" min={1} value={opt.copies} onChange={(e) => updateOption(file.id, "copies", Number(e.target.value))} required />
                </Field>
                <Field label="Binding">
                  <Select value={opt.binding} onChange={(e) => updateOption(file.id, "binding", e.target.value as any)}>
                    <option value="NONE">None</option>
                    <option value="SPIRAL">Spiral Bound</option>
                  </Select>
                </Field>
                <Field label="Lamination">
                  <Select value={String(opt.lamination)} onChange={(e) => updateOption(file.id, "lamination", e.target.value === "true")}>
                    <option value="false">No Lamination</option>
                    <option value="true">Yes, Laminate</option>
                  </Select>
                </Field>
                <Field label="Print Mode">
                  <Select value={opt.printMode} onChange={(e) => updateOption(file.id, "printMode", e.target.value as any)}>
                    <option value="BW">Black & White Only</option>
                    <option value="COLOR">Full Color</option>
                    <option value="CUSTOM">Custom Color Pages</option>
                  </Select>
                </Field>
                {opt.printMode === "CUSTOM" && (
                  <Field label="Specific Color Pages" hint="Example: 1-3,5,8">
                    <Input value={opt.colorPageRanges} onChange={(e) => updateOption(file.id, "colorPageRanges", e.target.value)} placeholder="e.g. 1-5, 10" required />
                  </Field>
                )}
              </CardContent>
            )}
            </Card>
          );
        })}
      </div>

      <Card className="h-fit sticky top-6 border-stone-200/60 shadow-sm">
        <CardHeader className="pb-4">
          <h2 className="font-semibold text-stone-950">Order Summary</h2>
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
          <div className="flex justify-between text-base text-stone-950 mt-1 pb-1">
            <span>Total</span>
            <strong>{formatCurrency(quote?.total ?? 0)}</strong>
          </div>
          {error ? <p className="text-red-700 bg-red-50 p-3 rounded-md border border-red-100 mt-2">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting || !quote} className="bg-teal-700 hover:bg-teal-800 transition-all h-12 text-base mt-2">
            <CreditCard className="h-5 w-5 mr-2" />
            {isSubmitting ? "Redirecting..." : "Pay Securely with PhonePe"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
