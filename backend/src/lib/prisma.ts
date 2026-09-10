import { PrismaClient } from '@prisma/client';
import { logPrismaQueries } from '../config/env';

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
// Query logging is opt-in via PRISMA_LOG_QUERIES=true. Every dashboard request
// selects a few hundred rows, so logging each statement buries real output.
export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: logPrismaQueries ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
