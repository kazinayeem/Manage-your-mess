import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { normalizeEmail } from "@/lib/utils";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
  interface User {
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
    suspended?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(String(credentials?.email ?? ""));
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const res = await response.json();
          if (!res.success || !res.data) {
            throw new Error(res.message || "Invalid credentials");
          }

          return {
            id: res.data.user.id,
            email: res.data.user.email,
            name: res.data.user.name,
            role: res.data.user.role,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.accessToken) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
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
