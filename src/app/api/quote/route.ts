import { calculatePageSplit, calculateQuote } from "@/lib/quote";
import { getDefaultShop } from "@/lib/shop";
import { printOptionsSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  const parsed = z.array(printOptionsSchema).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let shop;
  if (shopId && shopId !== "undefined") {
    const [s] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    shop = s || await getDefaultShop();
  } else {
    shop = await getDefaultShop();
  }
  
  // Calculate per-file split for the UI to display individual file summaries if needed
  // Or just sum them up for the UI. The UI currently expects a single global split for now, 
  // but let's return total split array or just total pages.
  let totalPages = 0;
  let colorPages = 0;
  let bwPages = 0;

  for (const options of parsed.data) {
    const split = calculatePageSplit(options);
    totalPages += split.totalPages;
    colorPages += split.colorPages;
    bwPages += split.bwPages;
  }

  const quote = calculateQuote(parsed.data, shop);

  return NextResponse.json({ 
    split: { totalPages, colorPages, bwPages }, 
    quote 
  });
}
