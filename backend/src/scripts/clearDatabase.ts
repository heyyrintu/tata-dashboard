import prisma from '../lib/prisma';

/** Wipe all imported shipment data. Run with: npm run clear-db */
async function main() {
  const deleted = await prisma.shipment.deleteMany();
  await prisma.dashboardSnapshot.deleteMany();
  console.log(`Deleted ${deleted.count} shipments and cleared dashboard snapshots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
