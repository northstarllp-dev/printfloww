"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { platformLogin } from "./actions";

export default function PlatformLoginPage() {
  const [state, action, pending] = useActionState(platformLogin, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#001a3a] to-slate-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center relative z-10">
        <img src="/DARKBG.png" alt="PrintFloww" className="h-10 w-auto object-contain mx-auto mb-3" />
        <p className="text-slate-400 text-xs tracking-widest uppercase font-semibold">Super Admin</p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl relative z-10">
        {/* Card header */}
        <div className="px-6 py-6 text-center border-b border-white/10">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-teal-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Super Admin Login</h1>
          <p className="text-slate-400 text-xs mt-1.5">Secure access to manage all shops &amp; shopkeepers</p>
        </div>

        <CardContent className="p-6">
          <form action={action} className="grid gap-4">
            <Field label="Email">
              <Input
                name="email"
                type="email"
                placeholder="superadmin@printfloww.com"
                required
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-teal-400/20"
              />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-teal-400/20"
              />
            </Field>

            {state?.error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                {state.error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="w-full mt-1 bg-teal-500 hover:bg-teal-400 text-white font-bold shadow-lg shadow-teal-500/20 transition-all"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign In to Super Admin
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Shopkeeper?{" "}
            <a href="/admin/login" className="text-teal-400 hover:underline">
              Use the admin login instead
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
