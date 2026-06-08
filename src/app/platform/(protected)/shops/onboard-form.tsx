"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { useActionState } from "react";
import { onboardShopkeeper } from "./actions";

export function OnboardForm() {
  const [state, action, pending] = useActionState(onboardShopkeeper, null);

  return (
    <Card className="bg-white/5 border-white/10">
      <div className="bg-teal-500/10 border-b border-teal-400/20 rounded-t-xl px-5 py-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-teal-400" />
        <h2 className="font-bold text-teal-300 text-sm">Onboard New Shopkeeper</h2>
      </div>
      <CardContent className="p-5">
        <form action={action} className="grid gap-4">
          <Field label="Shop Name">
            <Input
              name="shopName"
              required
              placeholder="e.g. Campus Copy Center"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400"
            />
          </Field>
          <Field label="Shopkeeper Name">
            <Input
              name="shopkeeperName"
              required
              placeholder="e.g. John Doe"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400"
            />
          </Field>
          <Field label="UPI ID (for payments)">
            <Input
              name="upiId"
              required
              placeholder="e.g. campuscopy@upi"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400"
            />
          </Field>
          <Field label="Shopkeeper Login Email">
            <Input
              name="email"
              type="email"
              required
              placeholder="e.g. john@campuscopy.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400"
            />
          </Field>
          <Field label="Initial Password (min. 8 chars)">
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-teal-400"
            />
          </Field>

          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 flex gap-2 items-start">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex gap-2 items-start">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {state.success}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold shadow-lg shadow-teal-500/20 transition-all"
          >
            {pending ? "Onboarding..." : "Onboard Shopkeeper"}
          </Button>
        </form>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          The shopkeeper will log in at{" "}
          <code className="text-slate-400 bg-white/5 px-1 rounded">/admin/login</code>
        </p>
      </CardContent>
    </Card>
  );
}
