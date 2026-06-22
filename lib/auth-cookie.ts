/** Must match `cookies.sessionToken.name` in lib/auth.ts — required for middleware getToken on Vercel. */
export function getSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}
