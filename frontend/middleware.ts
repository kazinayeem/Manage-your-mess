import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";
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
import { getSessionCookieName } from "./lib/auth-cookie";

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
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName: getSessionCookieName(),
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (isProtected && !token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathnameWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }

    const role = token?.role as UserRole | undefined;

    if (token && role) {
      if (pathnameWithoutLocale.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (pathnameIsSuperAdmin(pathnameWithoutLocale) && !canAccessSuperAdmin(role)) {
        return NextResponse.redirect(new URL(getPlatformHomeRoute(role), request.url));
      }

      if (
        (pathnameIsPortal(pathnameWithoutLocale) || pathnameIsMessScoped(pathnameWithoutLocale)) &&
        isAdminRole(role)
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (isAuthPath) {
        return NextResponse.redirect(new URL(getPlatformHomeRoute(role), request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
