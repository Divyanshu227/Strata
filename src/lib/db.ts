import { PrismaClient } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  const isDummy = !connectionString || connectionString.includes('[YOUR-PROJECT-REF]') || connectionString.includes('[PASSWORD]');
  const dbUrl = isDummy ? 'postgresql://postgres:postgres@localhost:5432/postgres' : connectionString;

  const pool = new Pool({
    connectionString: dbUrl,
    max: 5
  });

  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
