"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEXT_LOCALE_COOKIE = exports.ACTIVE_MESS_COOKIE = exports.REFRESH_COOKIE_NAME = exports.SESSION_COOKIE_NAME = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
function required(name, fallback) {
    const value = process.env[name];
    if (!value) {
        if (fallback !== undefined)
            return fallback;
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function optional(name) {
    const value = process.env[name];
    return value && value.trim() !== "" ? value : undefined;
}
exports.env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(optional("PORT") ?? 5000),
    DATABASE_URL: required("DATABASE_URL"),
    DIRECT_URL: optional("DIRECT_URL"),
    FRONTEND_URL: optional("FRONTEND_URL") ?? "http://localhost:3000",
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN") ?? "15m",
    JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN") ?? "30d",
    BCRYPT_ROUNDS: Number(optional("BCRYPT_ROUNDS") ?? 12),
    REDIS_URL: optional("REDIS_URL"),
    STORAGE_ROOT: optional("STORAGE_ROOT") ?? path_1.default.resolve(process.cwd(), "storage/uploads"),
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV !== "production",
};
exports.SESSION_COOKIE_NAME = "bornomess.session";
exports.REFRESH_COOKIE_NAME = "bornomess.refresh";
exports.ACTIVE_MESS_COOKIE = "messflow-active-mess-id";
exports.NEXT_LOCALE_COOKIE = "NEXT_LOCALE";
//# sourceMappingURL=env.js.map