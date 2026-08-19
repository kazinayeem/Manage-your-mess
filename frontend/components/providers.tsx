"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
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
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          {children}
        </SessionProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
