import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/token-storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function getHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith("http") ? path : `${BASE_URL}/api/v1${path}`;
  const headers = await getHeaders(options.headers as Record<string, string> | undefined);

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept 401 for Token Refresh
  if (
    response.status === 401 &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/refresh")
  ) {
    if (typeof window !== "undefined") {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            const refreshData = await refreshRes.json();
            if (refreshData.success && refreshData.data?.accessToken) {
              const newAccessToken = refreshData.data.accessToken;
              const newRefreshToken = refreshData.data.refreshToken || refreshToken;
              setTokens(newAccessToken, newRefreshToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
            } else {
              isRefreshing = false;
              clearTokens();
              return { success: false, message: "Session expired", statusCode: 401 };
            }
          } catch {
            isRefreshing = false;
            clearTokens();
            return { success: false, message: "Session expired", statusCode: 401 };
          }
        }

        const newToken = await new Promise<string>((resolve) => {
          addRefreshSubscriber(resolve);
        });

        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }
    }
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text || "Request failed" };
  }
}

export async function apiGet(path: string, options: RequestInit = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}

export async function apiPost(path: string, body?: any, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: "POST",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiPatch(path: string, body?: any, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: "PATCH",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiPut(path: string, body?: any, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: "PUT",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiDelete(path: string, options: RequestInit = {}) {
  return apiFetch(path, { ...options, method: "DELETE" });
}
