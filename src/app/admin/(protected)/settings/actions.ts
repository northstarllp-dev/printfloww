"use server";

import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { shopSettingsSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = shopSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  if (!admin.shopId) {
    throw new Error("Unauthorized. Only shopkeepers can update shop settings.");
  }

  await db
    .update(shops)
    .set({
      ...parsed.data,
      email: parsed.data.email || null,
      bwPriceA4: parsed.data.bwPriceA4.toFixed(2),
      bwPriceA3: parsed.data.bwPriceA3.toFixed(2),
      colorPriceA4: parsed.data.colorPriceA4.toFixed(2),
      colorPriceA3: parsed.data.colorPriceA3.toFixed(2),
      spiralBindingPrice: parsed.data.spiralBindingPrice.toFixed(2),
      laminationPrice: parsed.data.laminationPrice.toFixed(2),
      updatedAt: new Date()
    })
    .where(eq(shops.id, admin.shopId));

  revalidatePath("/admin/settings");
}
