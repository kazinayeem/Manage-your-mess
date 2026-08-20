import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthShowcase } from "@/components/auth/auth-showcase";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-white dark:bg-zinc-950">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 sm:right-6 sm:top-6">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <AuthShowcase />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
