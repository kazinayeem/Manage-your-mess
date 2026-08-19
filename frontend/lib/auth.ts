import { cookies } from "next/headers";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString()
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bornomess.session")?.value;
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
    return null;
  }

  return {
    accessToken: token,
    user: {
      id: payload.sub,
      role: payload.role,
      email: payload.email || "",
      name: payload.name || "",
    },
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bornomess.session")?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await response.json();
    if (res.success && res.data) {
      return {
        ...res.data.user,
        members: res.data.messes || [],
      };
    }
  } catch (error) {
    console.error("Error fetching current user from Express:", error);
  }
  return null;
}

// Mock handlers to satisfy NextAuth type expectations in case of imports
export const handlers = {
  GET: () => new Response("Not implemented", { status: 404 }),
  POST: () => new Response("Not implemented", { status: 404 }),
};

export async function signIn() {}
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("bornomess.session");
  cookieStore.delete("bornomess.refresh");
}
