import { statSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function getSchemaMtime(): number {
  try {
    return statSync(path.join(process.cwd(), "prisma/schema.prisma")).mtimeMs;
  } catch {
    return 0;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaMtime: number | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const schemaMtime = getSchemaMtime();

if (
  !globalForPrisma.prisma ||
  globalForPrisma.prismaSchemaMtime !== schemaMtime
) {
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaSchemaMtime = schemaMtime;
}

export const db = globalForPrisma.prisma;
