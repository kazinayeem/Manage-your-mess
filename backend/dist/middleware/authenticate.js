"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE_NAME = void 0;
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const env_1 = require("../config/env");
Object.defineProperty(exports, "REFRESH_COOKIE_NAME", { enumerable: true, get: function () { return env_1.REFRESH_COOKIE_NAME; } });
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const access_service_1 = require("../services/access.service");
/**
 * Verifies the JWT access token from the httpOnly cookie (or Authorization
 * header) and attaches the active user to req.user.
 */
async function authenticate(req, _res, next) {
    try {
        const token = req.cookies?.[env_1.SESSION_COOKIE_NAME] ??
            (req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.slice(7)
                : undefined);
        if (!token) {
            throw new errors_1.AuthError("Not authenticated");
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (!payload.sub)
            throw new errors_1.AuthError("Invalid token");
        const dbUser = await (0, access_service_1.loadActiveUser)(payload.sub);
        const sessionUser = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
        };
        req.user = sessionUser;
        next();
    }
    catch (err) {
        next(err instanceof errors_1.AuthError ? err : new errors_1.AuthError("Invalid or expired session"));
    }
}
/**
 * Attaches the user only if a valid session exists; does not reject
 * unauthenticated requests. Useful for optional-auth endpoints.
 */
async function optionalAuthenticate(req, _res, next) {
    try {
        const token = req.cookies?.[env_1.SESSION_COOKIE_NAME];
        if (token) {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            if (payload.sub) {
                const dbUser = await database_1.prisma.user.findUnique({ where: { id: payload.sub } });
                if (dbUser && !dbUser.deletedAt && dbUser.isActive) {
                    req.user = {
                        id: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.name,
                        role: dbUser.role,
                    };
                }
            }
        }
    }
    catch {
        // ignore invalid optional session
    }
    next();
}
//# sourceMappingURL=authenticate.js.map