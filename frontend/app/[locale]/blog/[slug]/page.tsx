import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Link } from "@/i18n/navigation";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.flatMap((post) => [
    { locale: "en", slug: post.slug },
    { locale: "bn", slug: post.slug },
  ]);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const isBn = locale === "bn";
  const post = getBlogPostBySlug(slug, isBn ? "bn" : "en");
  if (!post) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <Link href="/blog" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          {isBn ? "← ব্লগে ফিরে যান" : "← Back to blog"}
        </Link>

        <article className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative aspect-[16/8] bg-zinc-100 dark:bg-zinc-800">
            <Image src={post.image} alt={post.title} fill className="object-cover" />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {post.category}
              </span>
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>

            <div className="mt-10 space-y-10">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-8 text-zinc-700 dark:text-zinc-300">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
