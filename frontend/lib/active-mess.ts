import { cookies } from "next/headers";

export const ACTIVE_MESS_COOKIE = "messflow-active-mess-id";

export async function getActiveMessIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_MESS_COOKIE)?.value ?? null;
}

export async function setActiveMessIdCookie(messId: string) {
  const store = await cookies();
  store.set(ACTIVE_MESS_COOKIE, messId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
