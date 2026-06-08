import { db } from "@/db";
import { shops } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";

export const getDefaultShop = unstable_cache(
  async () => {
    const [shop] = await db.select().from(shops).limit(1);
    if (!shop) {
      throw new Error("Shop settings are not configured. Create one row in shops before accepting orders.");
    }
    return shop;
  },
  ["default-shop"],
  { tags: ["shop"], revalidate: 3600 }
);

export async function getShopById(id: string) {
  const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
  return shop || null;
}
