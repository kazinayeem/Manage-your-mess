import { Suspense } from "react";
import { JoinMessForm } from "@/components/mess/join-mess-form";
import { Link } from "@/i18n/navigation";

export default function PortalJoinMessPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Join Existing Mess</h1>
      <p className="text-sm text-zinc-500">
        Use an invite code, invite link, or QR code shared by your mess owner or manager.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
        <JoinMessForm redirectTo="/portal" />
      </Suspense>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/portal" className="text-emerald-600 hover:underline">
          Back to Portal
        </Link>
      </p>
    </div>
  );
}
