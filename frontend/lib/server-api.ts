import "server-only";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SESSION_COOKIE_NAME = "bornomess.session";

async function getHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

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

  const response = await fetch(url, {
    ...options,
    headers,
  });

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