import dotenv from 'dotenv';

/**
 * Loads .env before anything else runs.
 *
 * ES module imports are evaluated before any statement in the importing file,
 * so calling dotenv.config() inside server.ts runs AFTER every imported module
 * has already been constructed. Modules that read process.env at import time
 * (emailService builds its singleton in a constructor) therefore saw an empty
 * environment, which is why IMAP credentials appeared "missing" on some boots
 * and not others.
 *
 * Importing this module first makes the load order deterministic.
 */
dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

/** Opt-in flags — both default OFF so a plain dev boot stays quiet. */
export const emailPollingEnabled = process.env.ENABLE_EMAIL_POLLING === 'true';
export const logPrismaQueries = process.env.PRISMA_LOG_QUERIES === 'true';
