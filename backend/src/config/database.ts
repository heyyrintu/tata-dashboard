import prisma from '../lib/prisma';

export const connectDatabase = async () => {
  try {
    await prisma.$connect();

    // NOTE: SIGINT/SIGTERM are deliberately NOT handled here. They used to call
    // process.exit(0) the instant a signal arrived, which killed in-flight
    // requests. server.ts owns shutdown now: it drains the HTTP server first and
    // then disconnects this client.
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });

  } catch (error) {
    console.error('[Database] PostgreSQL connection error:', error);
  }
};

export default prisma;
