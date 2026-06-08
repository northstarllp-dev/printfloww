"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (current.count >= 5) throw new Error("Too many login attempts. Try again in a minute.");
  current.count += 1;
}

export async function platformLogin(_: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    checkRateLimit(email.toLowerCase());
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Invalid email or password" };

    // Verify this account has the OWNER role
    const session = await getPlatformSession();
    if (!session) {
      await supabase.auth.signOut();
      return { error: "This account is not authorized as a Super Admin. Shopkeepers should use /admin/login." };
    }
  } catch (caught) {
    return { error: caught instanceof Error ? caught.message : "Login failed" };
  }

  redirect("/platform/dashboard");
}

export async function platformLogout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/platform/login");
}
