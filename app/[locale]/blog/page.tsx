import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Link } from "@/i18n/navigation";
import { getBlogPosts } from "@/lib/blog-posts";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isBn = locale === "bn";
  const posts = getBlogPosts(isBn ? "bn" : "en");

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {isBn ? "ব্লগ" : "Blog"}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            {isBn ? "মেস ম্যানেজমেন্ট নিয়ে ৬টি দরকারি লেখা" : "6 practical guides for smarter mess management"}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {isBn
              ? "মিল রেট, জমা, বাজার, রুম, বিল, এবং analytics নিয়ে সহজ ভাষার static article।"
              : "Simple static articles on meal rate, deposits, bazaar, rooms, bills, and analytics."}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Image src={post.image} alt={post.title} fill className="object-cover" />
                </div>
              </Link>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {post.category}
                  </span>
                  <time>{post.date}</time>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">
                  <Link href={`/blog/${post.slug}`} className="hover:text-emerald-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {isBn ? "পুরো লেখাটি পড়ুন" : "Read full article"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
