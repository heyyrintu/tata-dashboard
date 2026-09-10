/**
 * Import an NPL MIS workbook through the real upload code path, then print the
 * analytics the dashboard will show. Used to verify the pipeline end to end.
 *
 *   npx ts-node --transpile-only src/scripts/importNplWorkbook.ts "<path to .xlsx>"
 */
import { processExcelFile } from '../controllers/uploadController';
import { getDashboard, getFilterOptions } from '../services/shipmentAnalytics';
import prisma from '../lib/prisma';

const file = process.argv[2];
if (!file) {
  console.error('Usage: ts-node src/scripts/importNplWorkbook.ts "<path to .xlsx>"');
  process.exit(1);
}

async function main() {
  console.log('=== IMPORT ===');
  const result = await processExcelFile(null, file, file.split(/[\\/]/).pop());
  console.log('  success   :', result.success);
  console.log('  message   :', result.message);
  if (result.error) console.log('  error     :', result.error);
  for (const s of result.sheets ?? []) {
    console.log(`  sheet     : ${s.name.padEnd(26)} -> ${s.branch.padEnd(11)} ${s.rows} rows (${s.skipped} skipped)`);
  }
  if (result.flagCounts) {
    for (const [k, v] of Object.entries(result.flagCounts)) console.log(`  flag      : ${k.padEnd(28)} ${v}`);
  }
  for (const w of result.warnings ?? []) console.log('  warning   :', w);

  if (!result.success) {
    process.exitCode = 1;
    return;
  }

  console.log('\n=== PERSISTED ===');
  const count = await prisma.shipment.count();
  const agg = await prisma.shipment.aggregate({
    _sum: { totalQuantityLtr: true, buckets: true },
    _min: { lrDate: true },
    _max: { lrDate: true },
  });
  console.log('  rows in DB:', count);
  console.log('  buckets   :', agg._sum.buckets?.toLocaleString('en-IN'));
  console.log('  litres    :', agg._sum.totalQuantityLtr?.toLocaleString('en-IN'));
  console.log('  LR range  :', agg._min.lrDate?.toISOString().slice(0, 10), '->', agg._max.lrDate?.toISOString().slice(0, 10));

  console.log('\n=== DASHBOARD PAYLOAD (no filters) ===');
  const d = await getDashboard({});
  const k = d.kpis;
  console.log('  shipments        :', k.shipments);
  console.log('  litres           :', k.litres.toLocaleString('en-IN'));
  console.log('  on-time          :', `${k.onTimePct}% of ${k.onTimeMeasurable} measurable (${k.onTimeLate} late)`);
  console.log('  avg delay        :', `${k.avgDelayDays} d`);
  console.log('  avg transit      :', k.avgTransitDays, 'd');
  console.log('  delivered        :', `${k.deliveredCount} (${k.deliveredPct}%)`);
  console.log('  POD received     :', `${k.podReceivedCount} (${k.podReceivedPct}%), ${k.podOutstandingCount} outstanding`);
  console.log('  returned/refused :', k.returnedCount);
  console.log('  branches/vendors :', k.branchCount, '/', k.vendorCount);
  console.log('  vehicles/parties :', k.vehicleCount, '/', k.partyCount);

  console.log('\n  delivery status  :', d.deliveryStatus.map((x) => `${x.status}=${x.count}`).join(', '));
  console.log('  POD status       :', d.pod.byStatus.map((x) => `${x.status}=${x.count}`).join(', '));
  console.log('  POD ageing       :', d.pod.ageing.map((x) => `${x.bucket}=${x.count}`).join(', '));
  console.log('  delay spread     :', d.onTime.delayDistribution.map((x) => `${x.bucket}=${x.count}`).join(', '));
  console.log('  months           :', d.volume.byMonth.map((m) => `${m.month}:${m.shipments}`).join(', '));
  console.log('  SKUs             :', d.volume.bySku.map((s) => `${s.sku}=${s.litres.toLocaleString('en-IN')}L`).join(', '));
  console.log('  load types       :', d.volume.byLoadType.map((l) => `${l.loadType}=${l.shipments}`).join(', '));

  console.log('\n  branches:');
  for (const b of d.volume.byBranch) {
    console.log(
      `    ${b.branch.padEnd(12)} ${String(b.shipments).padStart(4)} shp  ${b.litres.toLocaleString('en-IN').padStart(10)} L  on-time ${String(b.onTimePct).padStart(5)}%  POD ${String(b.podPct).padStart(5)}%  transit ${b.avgTransitDays ?? '—'} d`
    );
  }

  console.log('\n  top vendors:');
  for (const v of d.vendors.slice(0, 6)) {
    console.log(
      `    ${v.vendor.padEnd(26)} ${String(v.shipments).padStart(4)} shp  on-time ${String(v.onTimePct).padStart(5)}% (n=${v.measurable})  POD ${String(v.podPct).padStart(5)}%  returns ${v.returns}`
    );
  }

  console.log('\n  top lanes:');
  for (const l of d.lanes.slice(0, 6)) {
    console.log(`    ${l.lane.padEnd(30)} ${String(l.shipments).padStart(4)} shp  on-time ${l.onTimePct}%`);
  }

  console.log('\n  data quality:');
  if (d.dataQuality.length === 0) console.log('    (none)');
  for (const q of d.dataQuality) console.log(`    ${q.flag.padEnd(28)} ${String(q.count).padStart(4)} rows (${q.pct}%)`);

  console.log('\n=== FILTER OPTIONS ===');
  const o = await getFilterOptions();
  console.log('  branches :', o.branches.join(', '));
  console.log('  SKUs     :', o.skus.join(', '));
  console.log('  loadTypes:', o.loadTypes.join(', '));
  console.log('  statuses :', o.deliveryStatuses.join(', '));
  console.log('  vendors  :', o.vendors.length, 'total');
  console.log('  dateRange:', o.dateRange.from, '->', o.dateRange.to);

  console.log('\n=== FILTERED SPOT-CHECK (Sonipat only) ===');
  const son = await getDashboard({ branch: 'Sonipat' });
  console.log(
    `  ${son.meta.filteredRows} rows, ${son.kpis.litres.toLocaleString('en-IN')} L, on-time ${son.kpis.onTimePct}%`
  );
}

main()
  .catch((e) => {
    console.error('FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
