import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// In Next.js server-side environment, process.cwd() resolves to the root folder.
const dbPath = path.join(process.cwd(), 'dev.db');

const adapter = new PrismaBetterSqlite3({
  url: dbPath,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
