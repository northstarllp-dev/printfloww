import type { QuoteSnapshot } from "@/db/schema";

export type PricingSettings = {
  bwPriceA4: string | number;
  bwPriceA3: string | number;
  colorPriceA4: string | number;
  colorPriceA3: string | number;
  spiralBindingPrice: string | number;
  laminationPrice: string | number;
};

export type PrintOptionsInput = {
  paperSize: "A4" | "A3";
  copies: number;
  binding: "NONE" | "SPIRAL";
  lamination: boolean;
  entireDocumentColor: boolean;
  colorPageRanges?: string;
  totalPages: number;
};

export function parsePageRanges(input: string | undefined, totalPages: number) {
  if (!input?.trim()) return new Set<number>();

  const pages = new Set<number>();
  const parts = input.split(",");

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) throw new Error("Color page ranges contain an empty entry");

    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let page = start; page <= end; page += 1) pages.add(page);
    } else {
      const page = Number(part);
      if (!Number.isInteger(page) || page < 1) throw new Error(`Invalid page number: ${part}`);
      pages.add(page);
    }
  }

  for (const page of pages) {
    if (page > totalPages) throw new Error(`Color page ${page} exceeds total pages`);
  }

  return pages;
}

export function calculatePageSplit(options: PrintOptionsInput) {
  const colorPages = options.entireDocumentColor
    ? options.totalPages
    : parsePageRanges(options.colorPageRanges, options.totalPages).size;

  return {
    totalPages: options.totalPages,
    colorPages,
    bwPages: options.totalPages - colorPages
  };
}

export function calculateQuote(options: PrintOptionsInput, pricing: PricingSettings): QuoteSnapshot {
  const split = calculatePageSplit(options);
  const bwUnit = Number(options.paperSize === "A4" ? pricing.bwPriceA4 : pricing.bwPriceA3);
  const colorUnit = Number(options.paperSize === "A4" ? pricing.colorPriceA4 : pricing.colorPriceA3);
  const bwCost = split.bwPages * options.copies * bwUnit;
  const colorCost = split.colorPages * options.copies * colorUnit;
  const bindingCost = options.binding === "SPIRAL" ? Number(pricing.spiralBindingPrice) * options.copies : 0;
  const laminationCost = options.lamination ? Number(pricing.laminationPrice) * options.copies : 0;
  const total = bwCost + colorCost + bindingCost + laminationCost;

  return {
    bwCost,
    colorCost,
    bindingCost,
    laminationCost,
    total,
    currency: "INR",
    lineItems: [
      { label: "Black & White", amount: bwCost },
      { label: "Color", amount: colorCost },
      { label: "Binding", amount: bindingCost },
      { label: "Lamination", amount: laminationCost }
    ]
  };
}
