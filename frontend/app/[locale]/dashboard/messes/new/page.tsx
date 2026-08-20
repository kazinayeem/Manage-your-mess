"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useCreateMessMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewMessPage() {
  const router = useRouter();
  const [createMess] = useCreateMessMutation();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "");
    const address = String(formData.get("address") || "");
    const description = String(formData.get("description") || "");

    try {
      await createMess({
        name,
        address: address || undefined,
        description: description || undefined,
      }).unwrap();
      toast.success("Mess created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create mess");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create New Mess</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Mess Name</Label>
              <Input id="name" name="name" required placeholder="Green View Mess" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Dhaka, Bangladesh" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Mess"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
