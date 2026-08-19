"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Share2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { regenerateInviteCode } from "@/actions/mess";

interface InviteCardProps {
  messId: string;
  messName: string;
  inviteCode: string;
  canManage?: boolean;
}

export function InviteCard({ messId, messName, inviteCode, canManage = true }: InviteCardProps) {
  const [code, setCode] = useState(inviteCode);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const joinPath = `/portal/join-mess?code=${encodeURIComponent(code)}`;
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${joinPath}`
      : joinPath;

  async function copy(text: string, type: "code" | "link") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === "code" ? "Invite code copied!" : "Join link copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare() {
    const text = `Join ${messName} on MessFlow Pro!\n\nInvite code: ${code}\nLink: ${joinUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${messName}`, text, url: joinUrl });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    await copy(text, "link");
  }

  async function handleRegenerate() {
    if (!canManage) return;
    setRegenerating(true);
    const result = await regenerateInviteCode(messId);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Failed to regenerate code");
      setRegenerating(false);
      return;
    }
    if (!result.data?.inviteCode) {
      toast.error("Failed to regenerate code");
      setRegenerating(false);
      return;
    }
    setCode(result.data.inviteCode);
    toast.success("New invite code generated");
    setRegenerating(false);
  }

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-emerald-600" />
          Invite Members
        </CardTitle>
        <CardDescription>
          Share this code so others can join <strong>{messName}</strong>. They will appear as
          pending until you approve them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Invite Code
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-lg font-bold tracking-wider dark:border-zinc-800 dark:bg-zinc-900">
              {code}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copy(code, "code")}
              aria-label="Copy invite code"
            >
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => copy(joinUrl, "link")}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Join Link
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              New Code
            </Button>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          Members go to <strong>Join Mess</strong> and enter this code, or open the join link directly.
        </p>
      </CardContent>
    </Card>
  );
}
