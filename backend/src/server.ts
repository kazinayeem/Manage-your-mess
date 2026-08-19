import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully via Prisma.");

    app.listen(PORT, () => {
      console.log(`[BornoMess Backend] Express server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

startServer();
