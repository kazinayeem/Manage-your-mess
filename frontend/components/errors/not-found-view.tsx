"use client";

import Image from "next/image";
import NextLink from "next/link";
import { Link as I18nLink } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  LayoutDashboard,
  Mail,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETING_COVER } from "@/lib/marketing-images";

export type NotFoundViewProps = {
  code?: string;
  title: string;
  description: string;
  hint?: string;
  homeLabel: string;
  portalLabel: string;
  backLabel: string;
  contactLabel: string;
  pricingLabel: string;
  appName: string;
  /** Use plain Next.js links (root not-found without intl provider). */
  plainLinks?: boolean;
  /** Fits inside mess workspace main area (smaller, no full viewport height). */
  embedded?: boolean;
};

export function NotFoundView({
  code = "404",
  title,
  description,
  hint,
  homeLabel,
  portalLabel,
  backLabel,
  contactLabel,
  pricingLabel,
  appName,
  plainLinks = false,
  embedded = false,
}: NotFoundViewProps) {
  const Link = plainLinks
    ? ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
        <NextLink href={href} className={className}>
          {children}
        </NextLink>
      )
    : I18nLink;

  return (
    <div
      className={
        embedded
          ? "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-14 dark:border-zinc-800 dark:bg-zinc-900/30"
          : "relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:min-h-screen sm:py-24"
      }
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(228 228 231 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(228 228 231 / 0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={embedded ? "w-full max-w-md text-center" : "w-full max-w-lg text-center"}
      >
        <div className={`relative mx-auto mb-8 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl shadow-emerald-900/10 dark:border-zinc-800 ${embedded ? "h-20 w-32" : "h-28 w-44"}`}>
          <Image
            src={MARKETING_COVER}
            alt=""
            fill
            className="object-cover object-top"
            sizes="176px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 backdrop-blur dark:bg-zinc-950/90 dark:text-zinc-200">
            <SearchX className="h-4 w-4 text-emerald-600" />
            {appName}
          </div>
        </div>

        <p className={`bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text font-bold tracking-tight text-transparent ${embedded ? "text-5xl" : "text-7xl sm:text-8xl"}`}>
          {code}
        </p>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        {hint && (
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-500">{hint}</p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              {homeLabel}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" asChild>
            <Link href="/portal">
              <LayoutDashboard className="h-4 w-4" />
              {portalLabel}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full gap-2 sm:w-auto"
            type="button"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href="/pricing" className="text-emerald-600 hover:underline">
            {pricingLabel}
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <Link href="/contact" className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400">
            <Mail className="h-3.5 w-3.5" />
            {contactLabel}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
