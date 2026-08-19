import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, ValidationError } from "../utils/errors";
import { verifyPassword, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { setAuthCookies, clearAuthCookies, setActiveMessCookie } from "../utils/cookies";
import { sendSuccess, sendMessage } from "../utils/response";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      members: {
        where: { deletedAt: null },
        include: { mess: true },
      },
    },
  });

  if (!user || !user.passwordHash) {
    throw new AuthError("Invalid email or password");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AuthError("Invalid email or password");
  }

  if (!user.isActive || user.isLocked) {
    throw new AuthError("Account is inactive or locked");
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  setAuthCookies(res, accessToken, refreshToken);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const primaryMess = user.members.length > 0 ? user.members[0].mess : null;
  if (primaryMess) {
    setActiveMessCookie(res, primaryMess.id);
  }

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      image: user.image,
    },
    messes: user.members.map((m) => m.mess),
    accessToken,
    refreshToken,
  }, "Logged in successfully");
}

export async function register(req: Request, res: Response) {
  const { email, password, name, phone, role } = req.body;
  if (!email || !password || !name) {
    throw new ValidationError("Email, password, and name are required");
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    throw new ValidationError("Email is already registered");
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      name,
      phone,
      role: role || "MEMBER",
    },
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    accessToken,
    refreshToken,
  }, "Registration successful", 201);
}

export async function refreshToken(req: Request, res: Response) {
  const token = req.body.refreshToken || (req.cookies && req.cookies["bornomess.refresh"]);
  if (!token) {
    throw new AuthError("Refresh token missing");
  }

  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub, deletedAt: null },
  });

  if (!user || !user.isActive) {
    throw new AuthError("Invalid user session");
  }

  const newAccessToken = signAccessToken(user.id, user.role);
  const newRefreshToken = signRefreshToken(user.id);
  setAuthCookies(res, newAccessToken, newRefreshToken);

  return sendSuccess(res, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }, "Token refreshed");
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      image: true,
      locale: true,
      members: {
        where: { deletedAt: null },
        include: {
          mess: {
            select: {
              id: true,
              name: true,
              slug: true,
              inviteCode: true,
              mealRate: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new AuthError("User not found");

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      image: user.image,
      locale: user.locale,
    },
    messes: user.members.map((m) => ({
      ...m.mess,
      memberRole: m.role,
      memberStatus: m.status,
    })),
  });
}

export async function logout(req: Request, res: Response) {
  clearAuthCookies(res);
  return sendMessage(res, "Logged out successfully");
}
