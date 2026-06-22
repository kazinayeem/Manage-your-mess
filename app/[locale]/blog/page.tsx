import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Link } from "@/i18n/navigation";

const posts = [
  { slug: "meal-rate-calculation", title: "How Meal Rate Calculation Works", date: "2026-01-15" },
  { slug: "managing-deposits", title: "Managing Deposits with bKash & Nagad", date: "2026-02-01" },
  { slug: "room-management-tips", title: "Room Management Best Practices", date: "2026-03-10" },
];

export default async function BlogPage({
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
        <h1 className="text-4xl font-bold">Blog</h1>
        <div className="mt-10 space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <time className="text-sm text-zinc-500">{post.date}</time>
              <h2 className="mt-2 text-xl font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:text-emerald-600">
                  {post.title}
                </Link>
              </h2>
            </article>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
