import prisma from '../lib/prisma';

export const connectDatabase = async () => {
  try {
    console.log('[Database] Connecting to PostgreSQL via Prisma...');

    // Test the connection
    await prisma.$connect();
    console.log('[Database] PostgreSQL connected successfully via Prisma');

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
      console.log('[Database] PostgreSQL disconnected');
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
    console.log('[Database] Server will start but database operations may fail.');
    console.log('[Database] Troubleshooting steps:');
    console.log('   1. Check if PostgreSQL is running');
    console.log('   2. Verify DATABASE_URL in .env file');
    console.log('   3. Run "npx prisma migrate dev" to create tables');
    console.log('   4. Check network connectivity and credentials');
  }
};

export { prisma };
export default prisma;
