import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="absolute right-4 top-4 flex items-center gap-1 sm:right-6 sm:top-6">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      {children}
    </div>
  );
}
