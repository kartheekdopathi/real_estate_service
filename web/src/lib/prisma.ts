import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

function createMariaDbAdapter() {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = new URL(connectionUrl);

  return new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaLogs: Array<"query" | "error" | "warn"> =
  env.PRISMA_LOG_QUERIES === "true" ? ["query", "error", "warn"] : ["error", "warn"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createMariaDbAdapter(),
    log: prismaLogs,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
