import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Save } from "lucide-react";
import { updateSettings } from "./actions";

export default async function AdminSettingsPage() {
  const { admin } = await requireAdmin();
  const [shop] = await db.select().from(shops).where(eq(shops.id, admin.shopId)).limit(1);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-950">Settings</h1>
        <p className="mt-2 text-sm text-stone-600">Configure shop UPI details and pricing used by the quote engine.</p>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold">Shop Pricing</h2></CardHeader>
        <CardContent>
          <form action={updateSettings} className="grid gap-4 md:grid-cols-2">
            <Field label="Shop Name"><Input name="name" defaultValue={shop?.name} required /></Field>
            <Field label="UPI ID"><Input name="upiId" defaultValue={shop?.upiId} required /></Field>
            <Field label="Shop Email"><Input name="email" type="email" defaultValue={shop?.email ?? ""} /></Field>
            <Field label="B&W A4"><Input name="bwPriceA4" type="number" min={0} step="0.01" defaultValue={shop?.bwPriceA4} /></Field>
            <Field label="B&W A3"><Input name="bwPriceA3" type="number" min={0} step="0.01" defaultValue={shop?.bwPriceA3} /></Field>
            <Field label="Color A4"><Input name="colorPriceA4" type="number" min={0} step="0.01" defaultValue={shop?.colorPriceA4} /></Field>
            <Field label="Color A3"><Input name="colorPriceA3" type="number" min={0} step="0.01" defaultValue={shop?.colorPriceA3} /></Field>
            <Field label="Spiral Binding"><Input name="spiralBindingPrice" type="number" min={0} step="0.01" defaultValue={shop?.spiralBindingPrice} /></Field>
            <Field label="Lamination"><Input name="laminationPrice" type="number" min={0} step="0.01" defaultValue={shop?.laminationPrice} /></Field>
            <div className="md:col-span-2">
              <Button><Save className="h-4 w-4" />Save Settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
