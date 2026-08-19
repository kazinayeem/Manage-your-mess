"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/auth/me`
      );

      const res = await response.json();
      if (res.success && res.data) {
        setSession({
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/auth/logout`, {
      method: "POST",
    });
  } catch {}

  document.cookie = "bornomess.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "bornomess.refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

  window.location.assign(options?.callbackUrl || "/");
}
