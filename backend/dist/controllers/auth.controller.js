"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.refreshToken = refreshToken;
exports.me = me;
exports.logout = logout;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const cookies_1 = require("../utils/cookies");
const response_1 = require("../utils/response");
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new errors_1.ValidationError("Email and password are required");
    }
    const user = await database_1.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
            members: {
                where: { deletedAt: null },
                include: { mess: true },
            },
        },
    });
    if (!user || !user.passwordHash) {
        throw new errors_1.AuthError("Invalid email or password");
    }
    const isValid = await (0, password_1.verifyPassword)(password, user.passwordHash);
    if (!isValid) {
        throw new errors_1.AuthError("Invalid email or password");
    }
    if (!user.isActive || user.isLocked) {
        throw new errors_1.AuthError("Account is inactive or locked");
    }
    const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
    const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
    (0, cookies_1.setAuthCookies)(res, accessToken, refreshToken);
    // Update last login
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const primaryMess = user.members.length > 0 ? user.members[0].mess : null;
    if (primaryMess) {
        (0, cookies_1.setActiveMessCookie)(res, primaryMess.id);
    }
    return (0, response_1.sendSuccess)(res, {
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
async function register(req, res) {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name) {
        throw new errors_1.ValidationError("Email, password, and name are required");
    }
    const existing = await database_1.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
        throw new errors_1.ValidationError("Email is already registered");
    }
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const user = await database_1.prisma.user.create({
        data: {
            email: email.toLowerCase().trim(),
            passwordHash: hashedPassword,
            name,
            phone,
            role: role || "MEMBER",
        },
    });
    const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
    const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
    (0, cookies_1.setAuthCookies)(res, accessToken, refreshToken);
    return (0, response_1.sendSuccess)(res, {
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
async function refreshToken(req, res) {
    const token = req.body.refreshToken || (req.cookies && req.cookies["bornomess.refresh"]);
    if (!token) {
        throw new errors_1.AuthError("Refresh token missing");
    }
    const payload = (0, jwt_1.verifyRefreshToken)(token);
    const user = await database_1.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null },
    });
    if (!user || !user.isActive) {
        throw new errors_1.AuthError("Invalid user session");
    }
    const newAccessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
    const newRefreshToken = (0, jwt_1.signRefreshToken)(user.id);
    (0, cookies_1.setAuthCookies)(res, newAccessToken, newRefreshToken);
    return (0, response_1.sendSuccess)(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    }, "Token refreshed");
}
async function me(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const user = await database_1.prisma.user.findUnique({
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
    if (!user)
        throw new errors_1.AuthError("User not found");
    return (0, response_1.sendSuccess)(res, {
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
async function logout(req, res) {
    (0, cookies_1.clearAuthCookies)(res);
    return (0, response_1.sendMessage)(res, "Logged out successfully");
}
//# sourceMappingURL=auth.controller.js.map