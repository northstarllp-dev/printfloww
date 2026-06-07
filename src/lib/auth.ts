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

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
