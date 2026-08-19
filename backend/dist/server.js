"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const PORT = env_1.env.PORT || 5000;
async function startServer() {
    try {
        await database_1.prisma.$connect();
        console.log("Database connected successfully via Prisma.");
        app_1.app.listen(PORT, () => {
            console.log(`[BornoMess Backend] Express server running at http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start backend server:", error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map