"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = updateProfile;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function updateProfile(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { name, phone, image, locale } = req.body;
    const user = await database_1.prisma.user.update({
        where: { id: req.user.id },
        data: {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(image && { image }),
            ...(locale && { locale }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            image: true,
            locale: true,
            role: true,
        },
    });
    return (0, response_1.sendSuccess)(res, user, "Profile updated successfully");
}
//# sourceMappingURL=user.controller.js.map