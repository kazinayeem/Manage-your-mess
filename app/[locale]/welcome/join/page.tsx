import { Suspense } from "react";
import { JoinMessForm } from "@/components/mess/join-mess-form";
import { Link } from "@/i18n/navigation";

export default function WelcomeJoinPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Join Mess</h1>
        <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
          <JoinMessForm redirectTo="/member" />
        </Suspense>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/welcome" className="text-emerald-600 hover:underline">
            Back
          </Link>
        </p>
      </div>
    </div>
  );
}
