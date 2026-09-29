/**
 * Prisma Client Singleton
 *
 * Ensures a single PrismaClient instance is reused across the entire
 * application, preventing connection pool exhaustion (especially during
 * hot-module-reload in development).
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

// Extend globalThis so TypeScript knows about our global cache key
declare global {
   
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  // Cache on global in non-production so hot-reloads reuse the connection
  global.__prisma = prisma;
}

// Attach a query performance warning listener in development
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on("query", (e: { duration: number; query: string }) => {
    if (e.duration > 500) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}
