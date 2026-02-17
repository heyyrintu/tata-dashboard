import prisma from '../lib/prisma';

export const connectDatabase = async () => {
  try {
    await prisma.$connect();

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    // Handle SIGTERM
    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('[Database] PostgreSQL connection error:', error);
  }
};

export default prisma;
