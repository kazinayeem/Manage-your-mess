"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { getAccessToken, clearTokens } from "@/lib/token-storage";

export interface Session {
  accessToken?: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
}

interface SessionContextType {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    initialSession ? "authenticated" : "loading"
  );

  useEffect(() => {
    if (!initialSession) {
      fetchSession();
    }
  }, [initialSession]);

  async function fetchSession() {
    try {
      const res = await apiGet("/auth/me");

      if (res.success && res.data) {
        setSession({
          accessToken: getAccessToken() || undefined,
          user: res.data.user,
        });
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }

  return (
    <SessionContext.Provider value={{ data: session, status, update: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    return { data: null, status: "unauthenticated" as const, update: async () => {} };
  }
  return context;
}

export async function signIn(provider?: string, options?: any) {
  window.location.assign("/login");
}

export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await apiPost("/auth/logout");
  } catch {}

  clearTokens();

  window.location.assign(options?.callbackUrl || "/");
}
