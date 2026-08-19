import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

const faqs = [
  { q: "What is MessFlow Pro?", a: "A complete SaaS platform for managing messes, hostels, PG accommodations, and student housing." },
  { q: "Is there a free plan?", a: "Yes! The Free plan supports up to 10 members with basic meal, expense, and deposit tracking." },
  { q: "Which payment methods are supported?", a: "bKash, Nagad, Rocket, Upay, bank transfer, and cash deposits are all supported." },
  { q: "Can I use it in Bangla?", a: "Yes, MessFlow Pro fully supports both English and Bangla." },
  { q: "How is meal rate calculated?", a: "Meal Rate = Total Approved Expenses ÷ Total Meals. Member cost = Meal Count × Meal Rate." },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
        <h1 className="text-4xl font-bold">FAQ</h1>
        <div className="mt-10 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
