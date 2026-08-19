"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.normalizeEmail = normalizeEmail;
exports.slugify = slugify;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
//# sourceMappingURL=password.js.map