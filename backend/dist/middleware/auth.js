"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.requireRole = requireRole;
exports.requireActiveMess = requireActiveMess;
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const cookies_1 = require("../utils/cookies");
async function authenticateUser(req, res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else if (req.cookies && req.cookies[env_1.SESSION_COOKIE_NAME]) {
            token = req.cookies[env_1.SESSION_COOKIE_NAME];
        }
        if (!token) {
            throw new errors_1.AuthError("Authentication token missing");
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.sub, deletedAt: null },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isLocked: true,
            },
        });
        if (!user || !user.isActive || user.isLocked) {
            throw new errors_1.AuthError("User account disabled or not found");
        }
        // Determine active mess from header, query, or cookie
        const messIdHeader = req.headers["x-mess-id"];
        const cookieMessId = req.cookies ? (0, cookies_1.getActiveMessFromCookie)(req.cookies) : null;
        const activeMessId = messIdHeader || cookieMessId || undefined;
        let memberId;
        if (activeMessId) {
            const member = await database_1.prisma.member.findUnique({
                where: { messId_userId: { messId: activeMessId, userId: user.id } },
                select: { id: true },
            });
            if (member) {
                memberId = member.id;
            }
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            messId: activeMessId,
            memberId,
        };
        req.activeMessId = activeMessId;
        next();
    }
    catch (error) {
        next(error);
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AuthError("Authentication required"));
        }
        if (req.user.role === "SUPER_ADMIN") {
            return next();
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError(`Required role: ${allowedRoles.join(" or ")}`));
        }
        next();
    };
}
function requireActiveMess(req, res, next) {
    if (!req.activeMessId) {
        return next(new errors_1.ForbiddenError("Active Mess selection is required for this endpoint"));
    }
    next();
}
//# sourceMappingURL=auth.js.map