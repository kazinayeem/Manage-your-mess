"use client";

import { useState } from "react";
import { useCreateSupportTicketMutation } from "@/lib/store/api/super-admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

export default function PortalHelpPage() {
  const [loading, setLoading] = useState(false);
  const [createTicket] = useCreateSupportTicketMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const subject = String(fd.get("subject"));
    const description = String(fd.get("description"));

    try {
      await createTicket({ subject, description }).unwrap();
      toast.success("Support ticket submitted");
      e.currentTarget.reset();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit ticket");
    }
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
