import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import type { UserRole } from "@prisma/client";
import { getSessionCookieName } from "@/lib/auth-cookie";

declare module "next-auth" {
  interface Session {
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
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: getSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
        const { allowed } = await rateLimit(`login:${ip}`, 10, 900);
        if (!allowed) throw new Error("Too many login attempts. Try again later.");

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        // Auto-clear expired account lock
        if (user.isLocked && user.lockedUntil && user.lockedUntil <= new Date()) {
          await db.user.update({
            where: { id: user.id },
            data: { isLocked: false, lockedUntil: null, failedLoginCount: 0 },
          });
          user.isLocked = false;
          user.failedLoginCount = 0;
          user.lockedUntil = null;
        }

        // Clear stale lock without expiry
        if (user.isLocked && !user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { isLocked: false, failedLoginCount: 0 },
          });
          user.isLocked = false;
          user.failedLoginCount = 0;
        }

        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
          const lockMinutes = process.env.NODE_ENV === "development" ? 5 : 30;
          throw new Error(`Account is temporarily locked. Try again in ${lockMinutes} minutes.`);
        }
        if (!user.isActive || user.deletedAt) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const maxAttempts = process.env.NODE_ENV === "development" ? 15 : 5;
          const lockMinutes = process.env.NODE_ENV === "development" ? 5 : 30;
          const failedCount = user.failedLoginCount + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failedCount,
              isLocked: failedCount >= maxAttempts,
              lockedUntil:
                failedCount >= maxAttempts
                  ? new Date(Date.now() + lockMinutes * 60 * 1000)
                  : null,
            },
          });
          await db.securityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              ipAddress: ip,
              metadata: JSON.stringify({ reason: "invalid_password" }),
            },
          });
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            isLocked: false,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ip,
          },
        });

        await db.securityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_SUCCESS",
            ipAddress: ip,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    include: {
      members: { include: { mess: true }, where: { deletedAt: null } },
    },
  });
}
