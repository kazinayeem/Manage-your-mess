"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { broadcastNotification } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AnnouncementsManager() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await broadcastNotification(title, message);
    if (r.success) {
      toast.success(`Sent to ${r.data?.count ?? 0} users`);
      setTitle("");
      setMessage("");
      router.refresh();
    } else toast.error(r.error);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broadcast Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="mt-1" />
          </div>
          <Button type="submit" disabled={loading}>
            Send to all active users
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
