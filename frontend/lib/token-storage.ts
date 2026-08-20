const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const SESSION_COOKIE_NAME = "bornomess.session";
const REFRESH_COOKIE_NAME = "bornomess.refresh";

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    const maxAgeAccess = 15 * 60; // 15 min
    document.cookie = `${SESSION_COOKIE_NAME}=${accessToken}; Path=/; Max-Age=${maxAgeAccess}; SameSite=Lax`;

    if (refreshToken) {
      const maxAgeRefresh = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `${REFRESH_COOKIE_NAME}=${refreshToken}; Path=/; Max-Age=${maxAgeRefresh}; SameSite=Lax`;
    }
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) return token;

    const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (token) return token;

    const match = document.cookie.match(new RegExp(`(?:^|; )${REFRESH_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  return null;
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    document.cookie = `${REFRESH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
}
