"use client";

import { SessionProvider } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-client";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <StoreProvider>
      <ThemeProvider>
        <SessionProvider
          session={session}
        >
          {children}
        </SessionProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
