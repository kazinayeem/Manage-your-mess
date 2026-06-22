"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveCoupon, deleteCoupon } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type CouponRow = {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [loading, setLoading] = useState(false);

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
      router.refresh();
    } else toast.error(r.error);
    setLoading(false);
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
        {coupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-mono font-semibold">{c.code}</p>
                <p className="text-sm text-zinc-500">
                  {c.discountPercent ?? 0}% off · used {c.usedCount}
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
                      router.refresh();
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
