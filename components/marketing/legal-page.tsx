"use client";

import { Link } from "@/i18n/navigation";
import type { LegalDocument } from "@/lib/legal-content";

type LegalPageProps = {
  document: LegalDocument;
  locale: string;
};

export function LegalPage({ document, locale }: LegalPageProps) {
  const links = [
    { href: "/privacy", label: locale === "bn" ? "গোপনীয়তা" : "Privacy" },
    { href: "/terms", label: locale === "bn" ? "শর্তাবলী" : "Terms" },
    { href: "/refund", label: locale === "bn" ? "রিফান্ড নীতি" : "Refund Policy" },
    { href: "/cookies", label: locale === "bn" ? "কুকি নীতি" : "Cookie Policy" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2 text-sm text-zinc-500">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-zinc-200 px-3 py-1 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-700"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">{document.updatedAt}</p>

        <div className="mt-6 space-y-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
          {document.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        {document.sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{section.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
