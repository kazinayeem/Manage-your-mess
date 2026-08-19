"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const errors_1 = require("../utils/errors");
const permissions_1 = require("../constants/permissions");
/**
 * Role/permission gate for platform-level permissions (e.g. admin areas).
 * Mess-scoped access should use the messGuard middleware instead.
 */
function authorize(...permissions) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user)
            return next(new errors_1.ForbiddenError("Unauthorized"));
        if (permissions.length === 0)
            return next();
        const allowed = permissions.some((p) => (0, permissions_1.hasPermission)(user.role, p));
        if (!allowed)
            return next(new errors_1.ForbiddenError("Permission denied"));
        return next();
    };
}
//# sourceMappingURL=authorize.js.map