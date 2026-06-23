/**
 * Reset a user's password and clear login lock state.
 * Usage: npx tsx scripts/reset-password.ts <email> <new-password>
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "../lib/utils";

async function main() {
  const [, , rawEmail, newPassword] = process.argv;
  if (!rawEmail || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const email = normalizeEmail(rawEmail);
  const db = new PrismaClient();

  try {
    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!user) {
      console.error(`No user found for: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });

    console.log(`Password reset for ${user.email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
