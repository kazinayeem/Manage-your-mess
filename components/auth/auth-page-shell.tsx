import Image from "next/image";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { MARKETING_COVER } from "@/lib/marketing-images";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-white dark:bg-zinc-950">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 sm:right-6 sm:top-6">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src={MARKETING_COVER}
          alt="BornoMess Manager"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-sm font-medium text-emerald-200">BornoSoft</p>
          <p className="mt-2 text-2xl font-bold leading-tight">BornoMess Manager</p>
          <p className="mt-2 max-w-md text-sm text-emerald-100/90">
            Smart mess, hostel &amp; PG management for Bangladesh
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
