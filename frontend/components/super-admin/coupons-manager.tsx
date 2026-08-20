"use client";

import { useState } from "react";
import { useGetAdminCouponsQuery } from "@/lib/store/api/super-admin-api";
import { saveCoupon, deleteCoupon } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function CouponsManager() {
  const { data, isLoading, error } = useGetAdminCouponsQuery();
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [loading, setLoading] = useState(false);

  const coupons = data?.data || data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("code", code);
    fd.set("discountPercent", discountPercent);
    fd.set("isActive", "true");
    const r = await saveCoupon(fd);
    if (r.success) {
      toast.success("Coupon created");
      setCode("");
    } else toast.error(r.error);
    setLoading(false);
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading coupons from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading coupons</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <div>
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Discount %</Label>
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="mt-1 w-24"
              />
            </div>
            <Button type="submit" disabled={loading} className="self-end">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-2">
        {Array.isArray(coupons) && coupons.map((c: any) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-mono font-semibold">{c.code}</p>
                <p className="text-sm text-zinc-500">
                  {c.discountPercent ?? 0}% off · used {c.usedCount ?? 0}
                  {c.maxUses ? ` / ${c.maxUses}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={c.isActive ? "default" : "secondary"}>
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await deleteCoupon(c.id);
                    if (r.success) {
                      toast.success("Coupon deactivated");
                    } else toast.error(r.error);
                  }}
                >
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
