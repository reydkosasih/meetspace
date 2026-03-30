import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

function parseDbUrl(url) {
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  try {
    // Support both mysql:// and mariadb:// protocols
    const normalized = url.replace(/^mysql:\/\//, "mariadb://");
    const parsed = new URL(normalized);

    return {
      host: parsed.hostname || "127.0.0.1",
      port: parsed.port ? Number(parsed.port) : 3306,
      user: parsed.username ? decodeURIComponent(parsed.username) : "root",
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      database: parsed.pathname?.replace(/^\//, "") || undefined,
    };
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection string: "${url}"`);
  }
}

function createPrismaClient() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb(config);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
