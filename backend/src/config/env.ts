import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export const env = {
  NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  PORT: Number(optional("PORT") ?? 5000),
  DATABASE_URL: required("DATABASE_URL"),
  DIRECT_URL: optional("DIRECT_URL"),
  FRONTEND_URL: optional("FRONTEND_URL") ?? "http://localhost:3000",
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN") ?? "15m",
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN") ?? "30d",
  BCRYPT_ROUNDS: Number(optional("BCRYPT_ROUNDS") ?? 12),
  REDIS_URL: optional("REDIS_URL"),
  STORAGE_ROOT: optional("STORAGE_ROOT") ?? path.resolve(process.cwd(), "storage/uploads"),
  isProduction: (process.env.NODE_ENV as string) === "production",
  isDevelopment: (process.env.NODE_ENV as string) !== "production",
};

export const SESSION_COOKIE_NAME = "bornomess.session";
export const REFRESH_COOKIE_NAME = "bornomess.refresh";
export const ACTIVE_MESS_COOKIE = "messflow-active-mess-id";
export const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";