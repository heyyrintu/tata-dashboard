/**
 * Dry-run the NPL workbook parser and print a summary.
 * Reads only — touches no database.
 *
 *   npx ts-node --transpile-only src/scripts/inspectNplParse.ts "<path to .xlsx>"
 */
import { parseNplWorkbook, ShipmentInput } from '../utils/nplExcelParser';

const file = process.argv[2];
if (!file) {
  console.error('Usage: ts-node src/scripts/inspectNplParse.ts "<path to .xlsx>"');
  process.exit(1);
}

const report = parseNplWorkbook(file);
const rows = report.rows;

const sum = (fn: (r: ShipmentInput) => number) => rows.reduce((a, r) => a + (fn(r) || 0), 0);
const tally = (fn: (r: ShipmentInput) => string | null | undefined) => {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = fn(r) ?? '(null)';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

console.log('\n=== SHEETS ===');
if (report.sheets.length === 0) console.log('  (workbook has no sheets)');
for (const s of report.sheets) {
  if (s.rejected) {
    console.log(`  ${s.name.padEnd(28)} REJECTED: ${s.rejected}`);
    // Show the fields that DID resolve separately from the ones that did not:
    // a sheet that mapped several columns but still lacks LR DATE and PICKUP
    // LOCATION is a near miss, and looks nothing like a wrong-format file.
    if (s.matchedColumns.length) {
      console.log(`  ${''.padEnd(28)} mapped fields : ${s.matchedColumns.join(', ')}`);
    }
    if (s.unmatchedHeaders.length) {
      console.log(`  ${''.padEnd(28)} other headers : ${s.unmatchedHeaders.slice(0, 12).join(' | ')}`);
    }
    continue;
  }
  console.log(
    `  ${s.name.padEnd(28)} branch=${s.branch.padEnd(12)} in=${String(s.dataRows).padStart(5)}` +
      `  kept=${String(s.rows).padStart(5)}  skipped=${String(s.skipped).padStart(5)}`
  );
  for (const [reason, n] of Object.entries(s.skipReasons)) {
    console.log(`  ${''.padEnd(28)}   - ${reason}: ${n}`);
  }
  if (s.unmatchedHeaders.length) {
    console.log(`  ${''.padEnd(28)}   unmapped columns: ${s.unmatchedHeaders.join(' | ')}`);
  }
}

console.log('\n=== ROW ACCOUNTING ===');
console.log('  data rows in   :', report.totalDataRows);
console.log('  rows kept      :', rows.length);
console.log(
  '  rows skipped   :',
  report.totalDataRows - rows.length,
  Object.keys(report.skipReasons).length
    ? `(${Object.entries(report.skipReasons).map(([k, v]) => `${k}=${v}`).join(', ')})`
    : ''
);

// Everything below reads parsed rows. With none, the summaries are noise and
// the date-range line throws on an empty array - which is exactly what used to
// hide the diagnostics above on a zero-row parse.
if (rows.length === 0) {
  console.log('\n=== WARNINGS ===');
  if (report.warnings.length === 0) console.log('  (none)');
  for (const w of report.warnings) console.log('  -', w);
  console.log('\nNo rows parsed - nothing further to summarise.\n');
  process.exit(0);
}

console.log('\n=== TOTALS ===');
console.log('  rows           :', rows.length);
console.log('  buckets        :', sum((r) => r.buckets || 0).toLocaleString());
console.log('  litres         :', sum((r) => r.totalQuantityLtr || 0).toLocaleString());
console.log('  loading chg    :', sum((r) => r.loadingCharges || 0).toLocaleString());
console.log('  unloading chg  :', sum((r) => r.unloadingCharges || 0).toLocaleString());

const dates = rows.map((r) => r.lrDate).filter((d): d is Date => !!d);
if (dates.length === 0) {
  console.log('  LR date range  : (no row carries an LR date)');
} else {
  const times = dates.map((d) => d.getTime());
  console.log(
    '  LR date range  :',
    new Date(Math.min(...times)).toISOString().slice(0, 10),
    '->',
    new Date(Math.max(...times)).toISOString().slice(0, 10),
    `(${rows.length - dates.length} row(s) with no LR date)`
  );
}

console.log('\n=== BRANCH (rows / litres) ===');
for (const [b] of tally((r) => r.branch)) {
  const sub = rows.filter((r) => r.branch === b);
  const lt = sub.reduce((a, r) => a + (r.totalQuantityLtr || 0), 0);
  console.log(`  ${b.padEnd(14)} ${String(sub.length).padStart(4)} rows   ${lt.toLocaleString().padStart(10)} L`);
}

console.log('\n=== DELIVERY STATUS ===');
for (const [k, v] of tally((r) => r.deliveryStatus)) console.log(`  ${k.padEnd(20)} ${v}`);

console.log('\n=== POD STATUS ===');
for (const [k, v] of tally((r) => r.podStatus)) console.log(`  ${k.padEnd(20)} ${v}`);

console.log('\n=== MATERIAL SKU (derived from litres/bucket) ===');
for (const [k, v] of tally((r) => r.materialSku)) console.log(`  ${k.padEnd(20)} ${v}`);

console.log('\n=== LOAD TYPE ===');
for (const [k, v] of tally((r) => r.loadType)) console.log(`  ${k.padEnd(20)} ${v}`);

console.log('\n=== MONTH ===');
for (const [k, v] of tally((r) => r.monthKey).sort()) console.log(`  ${k.padEnd(20)} ${v}`);

const measurable = rows.filter((r) => r.isOnTime !== null && r.isOnTime !== undefined);
const onTime = measurable.filter((r) => r.isOnTime).length;
console.log('\n=== ON-TIME ===');
console.log(`  measurable rows : ${measurable.length} / ${rows.length}`);
console.log(
  `  on time         : ${onTime} (${measurable.length ? ((onTime / measurable.length) * 100).toFixed(1) : '0.0'}%)`
);
const delays = measurable.map((r) => r.delayDays || 0);
if (delays.length) {
  console.log(`  delay days      : min=${Math.min(...delays)} max=${Math.max(...delays)}`);
}

console.log('\n=== TOP VENDORS ===');
for (const [k, v] of tally((r) => r.vendorName).slice(0, 8)) console.log(`  ${k.padEnd(28)} ${v}`);

console.log('\n=== DATA FLAGS ===');
if (Object.keys(report.flagCounts).length === 0) console.log('  (none)');
for (const [k, v] of Object.entries(report.flagCounts)) console.log(`  ${k.padEnd(28)} ${v}`);

console.log('\n=== WARNINGS ===');
if (report.warnings.length === 0) console.log('  (none)');
for (const w of report.warnings) console.log('  -', w);

console.log('\n=== SAMPLE ROW ===');
console.log(JSON.stringify(rows[0], null, 2));
console.log();
