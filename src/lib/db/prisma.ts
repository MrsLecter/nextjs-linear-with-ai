import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "#prisma/client";
import { env } from "@/lib/env";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Reuse the client in development to avoid creating extra instances on hot reload.
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma; 
