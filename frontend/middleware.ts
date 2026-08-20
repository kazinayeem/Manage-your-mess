import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  canAccessSuperAdmin,
  getPlatformHomeRoute,
  pathnameIsSuperAdmin,
  pathnameIsPortal,
  pathnameIsMessScoped,
  pathnameIsMessDashboard,
  pathnameIsMemberDashboard,
  pathnameIsWelcome,
} from "./lib/route-guard";
import { isAdminRole } from "./lib/rbac";

const intlMiddleware = createMiddleware(routing);

const protectedPaths = [
  "/portal",
  "/mess",
  "/super-admin",
  "/dashboard",
  "/member",
  "/welcome",
  "/admin",
];
const authPaths = ["/login", "/register", "/forgot-password"];

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|bn)/, "") || "/";
}

/** Decode a JWT payload without verifying signature (Edge runtime safe). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const pathnameWithoutLocale = stripLocale(request.nextUrl.pathname);

  const isProtected = protectedPaths.some((p) => pathnameWithoutLocale.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathnameWithoutLocale.startsWith(p));
  const isLegacyRoute =
    pathnameIsMessDashboard(pathnameWithoutLocale) ||
    pathnameIsMemberDashboard(pathnameWithoutLocale) ||
    pathnameIsWelcome(pathnameWithoutLocale);

  if (isLegacyRoute) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (isProtected || isAuthPath) {
    // Stale session (user no longer exists in DB): clear cookies and force re-login.
    // loadActiveUser redirects here with this flag when the JWT sub is not found.
    if (isAuthPath && request.nextUrl.searchParams.get("reason") === "session_expired") {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("bornomess.session");
      res.cookies.delete("bornomess.refresh");
      return res;
    }

    // Read JWT directly from Express-issued session cookie
    const rawToken = request.cookies.get("bornomess.session")?.value ?? null;

    let payload: Record<string, unknown> | null = null;
    if (rawToken) {
      payload = decodeJwtPayload(rawToken);
      // Check expiry
      if (payload?.exp && Date.now() >= Number(payload.exp) * 1000) {
        payload = null;
      }
    }

    if (isProtected && !payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathnameWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }

    const role = payload?.role as string | undefined;

    if (payload && role) {
      if (pathnameWithoutLocale.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (pathnameIsSuperAdmin(pathnameWithoutLocale) && !canAccessSuperAdmin(role as any)) {
        return NextResponse.redirect(new URL(getPlatformHomeRoute(role as any), request.url));
      }

      if (
        (pathnameIsPortal(pathnameWithoutLocale) || pathnameIsMessScoped(pathnameWithoutLocale)) &&
        isAdminRole(role as any)
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (isAuthPath) {
        return NextResponse.redirect(new URL(getPlatformHomeRoute(role as any), request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)" ],
};
