"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { login } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="PrintFloww" className="h-10 w-auto object-contain mx-auto mb-1" />
      </div>

      <Card className="w-full max-w-sm shadow-xl">
        {/* Card header */}
        <div className="bg-[#003262] rounded-t-xl px-6 py-5 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Admin Sign In</h1>
          <p className="text-blue-200 text-xs mt-1">Enter your credentials to access the dashboard</p>
        </div>

        <CardContent className="p-6">
          <form action={action} className="grid gap-4">
            <Field label="Email">
              <Input
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </Field>

            {state?.error ? (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {state.error}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={pending}
              className="w-full mt-1"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
