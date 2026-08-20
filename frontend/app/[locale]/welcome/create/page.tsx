"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useCreateMessMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { messPath } from "@/lib/mess-routes";
import { toast } from "sonner";

export default function WelcomeCreateMessPage() {
  const router = useRouter();
  const [createMess] = useCreateMessMutation();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "");
    const address = String(formData.get("address") || "");

    try {
      const res = await createMess({ name, address: address || undefined }).unwrap();
      toast.success("Mess created! You are the owner.");
      const messId = res?.data?.id || res?.data?.messId || res?.id;
      router.push(messPath(messId));
      router.refresh();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create mess");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Mess"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-500">
            <Link href="/welcome" className="text-emerald-600 hover:underline">
              Back
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
