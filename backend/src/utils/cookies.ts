import type { Response } from "express";
import { ACTIVE_MESS_COOKIE, env, REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "../config/env";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProduction,
  path: "/",
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  res.cookie(SESSION_COOKIE_NAME, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie(SESSION_COOKIE_NAME, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { ...baseCookieOptions });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseCookieOptions });
}

export function setActiveMessCookie(res: Response, messId: string) {
  res.cookie(ACTIVE_MESS_COOKIE, messId, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}

export function getActiveMessFromCookie(cookies: Record<string, string>): string | null {
  return cookies[ACTIVE_MESS_COOKIE] ?? null;
}