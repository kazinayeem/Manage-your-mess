"use client";

import { useState } from "react";
import { createSupportTicket } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

export default function PortalHelpPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const r = await createSupportTicket(
      String(fd.get("subject")),
      String(fd.get("description"))
    );
    if (r.success) {
      toast.success("Support ticket submitted");
      e.currentTarget.reset();
    } else toast.error(r.error);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Help Center</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Message</Label>
              <Textarea id="description" name="description" required rows={4} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading}>
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-sm text-zinc-500">
        Or email us via the <Link href="/contact" className="text-emerald-600 hover:underline">contact page</Link>.
      </p>
    </div>
  );
}
