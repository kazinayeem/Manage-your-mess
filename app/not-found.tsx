import Link from "next/link";
import { NotFoundView } from "@/components/errors/not-found-view";

/** Root 404 — used when locale layout is unavailable (e.g. invalid locale). */
export default function RootNotFoundPage() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-zinc-950">
        <NotFoundView
          plainLinks
          title="Page not found"
          description="The page you are looking for does not exist, was moved, or you do not have access to it."
          hint="Check the URL or return to BornoMess Manager home."
          homeLabel="Go home"
          portalLabel="Open portal"
          backLabel="Go back"
          contactLabel="Contact support"
          pricingLabel="View pricing"
          appName="BornoMess Manager"
        />
        <p className="pb-8 text-center text-xs text-zinc-400">
          <Link href="/bn" className="hover:text-emerald-600">
            বাংলা
          </Link>
          {" · "}
          <Link href="/" className="hover:text-emerald-600">
            English
          </Link>
        </p>
      </body>
    </html>
  );
}
