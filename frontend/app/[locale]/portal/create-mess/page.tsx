"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createMess } from "@/actions/mess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { messPath } from "@/lib/mess-routes";
import { toast } from "sonner";

export default function PortalCreateMessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createMess(formData);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success("Mess created! You are the owner.");
    router.push(messPath(result.data!.messId));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Create New Mess</h1>
      <Card>
        <CardHeader>
          <CardTitle>Mess details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Mess Name *</Label>
              <Input id="name" name="name" required placeholder="Bachelor Life" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Dhaka, Bangladesh" className="mt-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue="Asia/Dhaka" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue="BDT" className="mt-1" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  name="language"
                  defaultValue="en"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                </select>
              </div>
              <div>
                <Label htmlFor="memberLimit">Member Limit</Label>
                <Input id="memberLimit" name="memberLimit" type="number" min={1} placeholder="50" className="mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Mess"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/portal" className="text-emerald-600 hover:underline">
          Back to Portal
        </Link>
      </p>
    </div>
  );
}
