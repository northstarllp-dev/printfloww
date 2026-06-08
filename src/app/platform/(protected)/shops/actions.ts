"use server";

import { db } from "@/db";
import { adminUsers, shops } from "@/db/schema";
import { getPlatformSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function onboardShopkeeper(prevState: any, formData: FormData) {
  const session = await getPlatformSession();
  if (!session) {
    return { error: "Unauthorized. Only platform owners can onboard shopkeepers." };
  }

  const shopName = String(formData.get("shopName") ?? "").trim();
  const shopkeeperName = String(formData.get("shopkeeperName") ?? "").trim();
  const upiId = String(formData.get("upiId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!shopName || !shopkeeperName || !upiId || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    // 1. Create the user in Supabase Auth via Admin client
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !userData.user) {
      return { error: authError?.message || "Failed to create authentication account." };
    }

    // 2. Insert the Shop record
    const [shop] = await db
      .insert(shops)
      .values({
        name: shopName,
        shopkeeperName,
        upiId,
        email
      })
      .returning();

    // 3. Link the User in admin_users with SHOPKEEPER role
    await db.insert(adminUsers).values({
      id: userData.user.id,
      shopId: shop.id,
      email: email,
      role: "SHOPKEEPER"
    });

    revalidatePath("/platform/shops");
    revalidatePath("/platform/dashboard");
    return { success: `Successfully onboarded "${shopName}" — shopkeeper can now log in at /admin/login.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred during onboarding." };
  }
}

export async function deleteShop(shopId: string) {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };

  try {
    // Find admin user linked to this shop
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.shopId, shopId))
      .limit(1);

    if (adminUser) {
      // Delete from Supabase Auth
      const supabaseAdmin = createSupabaseAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
    }

    // Delete the shop (cascade deletes orders, files, etc.)
    await db.delete(shops).where(eq(shops.id, shopId));

    revalidatePath("/platform/shops");
    revalidatePath("/platform/dashboard");
    return { success: "Shop deleted successfully." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete shop." };
  }
}
