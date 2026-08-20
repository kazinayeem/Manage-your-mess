"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useJoinMessMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import { messPath } from "@/lib/mess-routes";

export function JoinMessForm({ redirectTo = "/portal" }: { redirectTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [joinMess] = useJoinMessMutation();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl) setCode(fromUrl);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await joinMess({ inviteCode: code.trim() }).unwrap();
      toast.success("Join request sent! Waiting for manager approval.");
      const messId = res?.data?.messId || res?.messId;
      router.push(messId ? messPath(messId) : redirectTo);
    } catch (err: any) {
      toast.error(err?.data?.message || "Join request failed");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Join a Mess</CardTitle>
        <CardDescription>
          Enter the invite code shared by your mess manager or owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              required
              placeholder="Paste invite code here"
              className="mt-1 font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Joining..." : "Join Mess"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
