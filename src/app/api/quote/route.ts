import { calculatePageSplit, calculateQuote } from "@/lib/quote";
import { getDefaultShop } from "@/lib/shop";
import { printOptionsSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const parsed = printOptionsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await getDefaultShop();
  const split = calculatePageSplit(parsed.data);
  const quote = calculateQuote(parsed.data, shop);

  return NextResponse.json({ split, quote });
}
