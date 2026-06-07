import { db } from "@/db";
import { shops } from "@/db/schema";
import { unstable_cache } from "next/cache";

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
