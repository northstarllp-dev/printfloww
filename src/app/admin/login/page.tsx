"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { login } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="grid min-h-[calc(100vh-200px)] place-items-center px-4">
      <Card className="w-full max-w-md border-stone-200/60 shadow-xl shadow-stone-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/10 hover:border-teal-100 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
            <LogIn className="h-6 w-6 text-teal-700" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-950">Welcome back</h1>
          <p className="text-sm text-stone-500">Sign in to your admin dashboard</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={action} className="grid gap-5">
            <Field label="Email">
              <Input name="email" type="email" placeholder="admin@example.com" className="bg-stone-50/50 focus-visible:ring-teal-700 focus-visible:border-teal-700 transition-shadow" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="••••••••" className="bg-stone-50/50 focus-visible:ring-teal-700 focus-visible:border-teal-700 transition-shadow" required />
            </Field>
            {state?.error ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                {state.error}
              </div>
            ) : null}
            <Button disabled={pending} className="mt-2 w-full bg-teal-700 hover:bg-teal-800 transition-colors shadow-md hover:shadow-lg">
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
