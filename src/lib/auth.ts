import { adminUsers } from "@/db/schema";
import { db } from "@/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, user.id)).limit(1);
  if (!admin) return null;

  return { user, admin };
}

/**
 * Requires the caller to be an authenticated SHOPKEEPER.
 * Platform owners (OWNER role) are NOT allowed here — they have /platform.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || session.admin.role !== "SHOPKEEPER") redirect("/admin/login");
  return session;
}

/**
 * Returns session only if the authenticated user has the OWNER role.
 * Used by the /platform route group.
 */
export async function getPlatformSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, user.id)).limit(1);
  if (!admin || admin.role !== "OWNER") return null;

  return { user, admin };
}

/**
 * Requires the caller to be the authenticated platform OWNER.
 * Shopkeepers are NOT allowed here — they belong in /admin.
 */
export async function requirePlatformAdmin() {
  const session = await getPlatformSession();
  if (!session) redirect("/platform/login");
  return session;
}
