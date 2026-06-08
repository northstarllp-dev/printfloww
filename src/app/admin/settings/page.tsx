import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Save, IndianRupee, Store, Layers } from "lucide-react";
import { updateSettings } from "./actions";

export default async function AdminSettingsPage() {
  const { admin } = await requireAdmin();
  const [shop] = await db.select().from(shops).where(eq(shops.id, admin.shopId)).limit(1);

  return (
    <div className="grid gap-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure shop UPI details and pricing used by the quote engine.
        </p>
      </div>

      <form action={updateSettings} className="grid gap-4">
        {/* Shop info */}
        <Card>
          <div className="bg-[#003262] rounded-t-xl px-5 py-3.5 flex items-center gap-2">
            <Store className="h-4 w-4 text-white" />
            <h2 className="font-bold text-white text-sm">Shop Information</h2>
          </div>
          <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
            <Field label="Shop Name">
              <Input name="name" defaultValue={shop?.name} required placeholder="My Print Shop" />
            </Field>
            <Field label="UPI ID">
              <Input name="upiId" defaultValue={shop?.upiId} required placeholder="yourname@upi" />
            </Field>
            <Field label="Shop Email" className="sm:col-span-2">
              <Input
                name="email"
                type="email"
                defaultValue={shop?.email ?? ""}
                placeholder="orders@myshop.com"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <div className="bg-[#003262] rounded-t-xl px-5 py-3.5 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-white" />
            <h2 className="font-bold text-white text-sm">Print Pricing (₹ per page)</h2>
          </div>
          <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
            <Field label="B&amp;W — A4">
              <Input
                name="bwPriceA4"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.bwPriceA4}
                placeholder="1.50"
              />
            </Field>
            <Field label="B&amp;W — A3">
              <Input
                name="bwPriceA3"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.bwPriceA3}
                placeholder="3.00"
              />
            </Field>
            <Field label="Color — A4">
              <Input
                name="colorPriceA4"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.colorPriceA4}
                placeholder="8.00"
              />
            </Field>
            <Field label="Color — A3">
              <Input
                name="colorPriceA3"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.colorPriceA3}
                placeholder="16.00"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Finishing */}
        <Card>
          <div className="bg-[#003262] rounded-t-xl px-5 py-3.5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-white" />
            <h2 className="font-bold text-white text-sm">Finishing Options (₹ per item)</h2>
          </div>
          <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
            <Field label="Spiral Binding">
              <Input
                name="spiralBindingPrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.spiralBindingPrice}
                placeholder="40.00"
              />
            </Field>
            <Field label="Lamination">
              <Input
                name="laminationPrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={shop?.laminationPrice}
                placeholder="20.00"
              />
            </Field>
          </CardContent>
        </Card>

        <div>
          <Button type="submit" variant="primary" size="lg">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
