"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
function createPrismaClient() {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
}
exports.prisma = globalForPrisma.prisma;
//# sourceMappingURL=database.js.map