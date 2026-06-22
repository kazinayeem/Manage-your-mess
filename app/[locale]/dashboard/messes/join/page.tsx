import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { JoinMessForm } from "@/components/mess/join-mess-form";

export default async function JoinMessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-bold">Join Mess</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
        <JoinMessForm />
      </Suspense>
    </div>
  );
}
