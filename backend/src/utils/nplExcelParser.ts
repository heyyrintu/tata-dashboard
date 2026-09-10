import * as XLSX from 'xlsx';
import { canonicaliseVendor } from '../config/vendorAliases';

/**
 * Parser for the NPL DEF "MIS Data - Master Sheet" workbook.
 *
 * The workbook carries one tab per branch, but the tabs are NOT column-identical:
 *  - "Sept. MIS SONIPAT" and "MIS GANDHIDHAM" have no LR STATUS column
 *  - "MIS SONIPAT Till AUGUST" adds "Remarks 1" and "Route Code2"
 *  - the Remarks header is misspelled "Remarsk" on three tabs
 * so every column is resolved by header NAME, never by position.
 *
 * Sonipat arrives split across two tabs ("Till AUGUST" + "Sept.") and is unioned
 * into a single branch on import.
 */

export interface ShipmentInput {
  srNo?: number | null;
  sourceSheet?: string | null;
  branch?: string | null;
  pickupLocation?: string | null;
  partyName?: string | null;
  destination?: string | null;
  lane?: string | null;
  invoiceNumber?: string | null;
  lrNo?: string | null;
  lrDate?: Date | null;
  material?: string | null;
  materialSku?: string | null;
  packSizeLtr?: number | null;
  buckets?: number;
  totalQuantityLtr?: number;
  loadType?: string | null;
  expectedDeliveryDate?: Date | null;
  actualDeliveryDate?: Date | null;
  dispatchDate?: Date | null;
  dispatchFrom?: string | null;
  deliveryStatus?: string | null;
  deliveryStatusRaw?: string | null;
  lrStatus?: string | null;
  damage?: boolean;
  delayDays?: number | null;
  isOnTime?: boolean | null;
  dispatchToDeliveryDays?: number | null;
  loadingCharges?: number;
  unloadingCharges?: number;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  vendorName?: string | null;
  dispatchVehicle?: string | null;
  routeCode?: string | null;
  ply?: number;
  podStatus?: string | null;
  podStatusRaw?: string | null;
  podReceived?: boolean;
  monthKey?: string | null;
  remarks?: string | null;
  dataFlags?: string | null;
}

export interface ParseReport {
  rows: ShipmentInput[];
  sheets: { name: string; branch: string; rows: number; skipped: number }[];
  flagCounts: Record<string, number>;
  warnings: string[];
}

/** Column aliases -> canonical field. Compared after normaliseHeader(). */
const COLUMN_ALIASES: Record<string, string[]> = {
  srNo: ['SR NO', 'SRNO', 'S NO', 'SERIAL NO'],
  pickupLocation: ['PICKUP LOCATION', 'PICK UP LOCATION'],
  partyName: ['PARTY NAME', 'CUSTOMER NAME'],
  destination: ['DESTINATION'],
  invoiceNumber: ['INVOICE NUMBER', 'INVOICE NO'],
  lrNo: ['LR NO', 'LR NUMBER'],
  lrDate: ['LR DATE'],
  material: ['MATERIAL DETAILS', 'MATERIAL'],
  buckets: ['BUCKET', 'BUCKETS', 'NO OF BUCKETS'],
  totalQuantityLtr: ['TOTAL QUANTITY IN LTRS', 'TOTAL QUANTITY IN LTR', 'TOTAL QUANTITY'],
  loadType: ['LOAD TYPE FTL/PTL', 'LOAD TYPE', 'FTL/PTL'],
  expectedDeliveryDate: ['EXPECTED DELIVERY DATE'],
  actualDeliveryDate: ['ACTUAL DELIVERY DATE'],
  deliveryStatus: ['DELIVERY STATUS'],
  lrStatus: ['LR STATUS'],
  damage: ['DAMAGE'],
  loadingCharges: ['LOADING CHARGES', 'LOADING CHARGE'],
  unloadingCharges: ['UNLOADING CHARGES', 'UNLOADING CHARGE'],
  vehicleNumber: ['VEHICLE NUMBER', 'VEHICLE NO'],
  vehicleType: ['VEHICLE TYPE'],
  ply: ['PLY'],
  remarks: ['REMARKS', 'REMARSK', 'REMARK', 'REMARKS 1'],
  dispatchDate: ['DISPATCH DATE'],
  dispatchFrom: ['DISPATCHFROM', 'DISPATCH FROM'],
  dispatchVehicle: ['DISPATCH VEHICLE'],
  vendorName: ['VENDOR NAME', 'VENDOR'],
  routeCode: ['ROUTE CODE', 'ROUTE CODE2', 'ROUTE CODE 2'],
  podStatus: ['POD STATUS', 'POD'],
};

function normaliseHeader(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .trim()
    .toUpperCase();
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function cleanString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Pin a date to UTC midnight so day-diffs are exact.
 * Reads the UTC components, never the local ones: SheetJS anchors cell dates to
 * the file's timezone, so local getters shift the day by one on some hosts.
 */
function toUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Dates arrive as Excel serials (the workbook is read with cellDates:false so
 * the conversion stays under our control) or as hand-typed text. The sheets
 * contain values like "21-082026" - a missing separator - which would
 * otherwise be dropped.
 */
function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return toUtcDay(v);

  if (typeof v === 'number' && v > 0) {
    // Excel serial -> UTC day. Serials are whole days from 1899-12-30, so this
    // is exact and unaffected by the host timezone.
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : toUtcDay(d);
  }

  const s = String(v).trim();
  if (!s) return null;

  // "21-082026" / "21-08-2026" / "21/08/2026" -> 2026-08-21
  const compact = s.match(/^(\d{1,2})[-/](\d{2})[-/]?(\d{4})$/);
  if (compact) {
    const [, dd, mm, yyyy] = compact;
    const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : toUtcDay(parsed);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function normaliseDeliveryStatus(raw: string | null): string | null {
  if (!raw) return null;
  const u = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  if (u.includes('REFUSED')) return 'Refused';
  if (u.includes('HANDOVER')) return 'Handover to NPL';
  if (u.includes('RETURN')) return 'Returned';
  if (u.includes('DELIVER')) return 'Delivered';
  if (u.includes('TRANSIT')) return 'In Transit';
  if (u.includes('PENDING')) return 'Pending';
  return titleCase(u);
}

function normalisePodStatus(raw: string | null): string | null {
  if (!raw) return 'Pending';
  const u = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  if (u.includes('REFUSED')) return 'Returned';
  if (u.includes('RETURN')) return 'Returned';
  if (u.includes('RECEIVED')) return 'Received';
  if (u === 'WH' || u.includes('WAREHOUSE')) return 'At WH';
  if (u.includes('PENDING')) return 'Pending';
  return titleCase(u);
}

/**
 * Litres per bucket declared by the material name.
 *
 * The names are inconsistent (23 spellings on the Sonipat tab alone) but they
 * encode the pack two ways, both of which reduce to litres/bucket:
 *   "TATA Motors HP Genuine Def - 1*20L"  -> 1 x 20L  = 20
 *   "TATA Genius DEF (6*2) - PVBU"        -> 6 x 2L   = 12
 *   "CVBU- TATA GENUINE 210 LTR BUCKET"   ->            210
 */
function declaredPackSize(material: string | null): number | null {
  if (!material) return null;
  const multi = material.match(/(\d+)\s*\*\s*(\d+)/);
  if (multi) {
    const n = Number(multi[1]) * Number(multi[2]);
    return n > 0 ? n : null;
  }
  const litre = material.match(/(\d+(?:\.\d+)?)\s*(?:LTR|LITRE|LITER|L)/i);
  if (litre) {
    const n = Number(litre[1]);
    return n > 0 ? n : null;
  }
  return null;
}

/**
 * Reconcile the pack size the material name declares against the one the
 * numbers imply (litres / buckets).
 *
 * They disagree on 26 rows because TOTAL QUANTITY was mistyped - some rows
 * repeat the bucket count instead of the litres ("1*20L", 50 buckets, 50 L),
 * others are simply wrong (25 buckets of 20L recorded as 625 L). The declared
 * name is the trustworthy side, so it wins for the SKU label, but the litres
 * are left exactly as the sheet has them: silently rewriting volumes would
 * break reconciliation against the sheet's own TOTAL row and hide the error
 * from whoever needs to fix it. The mismatch is flagged instead.
 */
function derivePack(
  buckets: number,
  litres: number,
  material: string | null
): { packSizeLtr: number | null; sku: string | null; mismatch: boolean } {
  const declared = declaredPackSize(material);
  const implied =
    buckets > 0 && litres > 0
      ? (() => {
          const raw = litres / buckets;
          return Math.abs(raw - Math.round(raw)) < 0.01 ? Math.round(raw) : Math.round(raw * 100) / 100;
        })()
      : null;

  const mismatch = declared !== null && implied !== null && Math.abs(declared - implied) > 0.01;
  const pack = declared ?? implied;

  return {
    packSizeLtr: pack,
    sku: pack === null ? null : `${pack}L`,
    mismatch,
  };
}

function monthKeyOf(d: Date | null): string | null {
  if (!d) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Branch name from the sheet's pickup location, falling back to the tab name. */
function deriveBranch(pickup: string | null, sheetName: string): string {
  if (pickup) return titleCase(pickup);
  const m = sheetName.toUpperCase().match(/(LUCKNOW|SONIPAT|GANDHIDHAM|VARANASI)/);
  return m ? titleCase(m[1]) : titleCase(sheetName.replace(/^MIS\s*/i, '').trim());
}

function buildColumnMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((cell, idx) => {
    const h = normaliseHeader(cell);
    if (!h) return;
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      // First matching column wins, so "Remarks" beats a later "Remarks 1".
      if (map[field] === undefined && aliases.includes(h)) {
        map[field] = idx;
        return;
      }
    }
  });
  return map;
}

/** The header sits on row 2 on every current tab, but scan a few rows to be safe. */
function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const norm = (rows[i] || []).map(normaliseHeader);
    if (norm.includes('PICKUP LOCATION') || norm.includes('LR DATE')) return i;
  }
  return 0;
}

export function parseNplWorkbook(filePath: string): ParseReport {
  const workbook = XLSX.readFile(filePath, { cellDates: false, cellFormula: false });

  const out: ShipmentInput[] = [];
  const sheets: ParseReport['sheets'] = [];
  const flagCounts: Record<string, number> = {};
  const warnings: string[] = [];

  const flag = (bucket: string[], name: string) => {
    bucket.push(name);
    flagCounts[name] = (flagCounts[name] || 0) + 1;
  };

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    });
    if (grid.length === 0) continue;

    const headerIdx = findHeaderRow(grid);
    const col = buildColumnMap(grid[headerIdx] || []);

    if (col.lrDate === undefined && col.pickupLocation === undefined) {
      warnings.push(`Sheet "${sheetName}" has no recognisable header row - skipped.`);
      continue;
    }
    if (col.lrStatus === undefined) {
      warnings.push(`Sheet "${sheetName}" has no LR STATUS column.`);
    }

    const get = (row: unknown[], field: string): unknown =>
      col[field] === undefined ? null : row[col[field]];

    let kept = 0;
    let skipped = 0;

    for (const row of grid.slice(headerIdx + 1)) {
      const lrDate = parseDate(get(row, 'lrDate'));
      const pickupLocation = cleanString(get(row, 'pickupLocation'));
      const buckets = toNumber(get(row, 'buckets'));
      const litres = toNumber(get(row, 'totalQuantityLtr'));
      const partyName = cleanString(get(row, 'partyName'));

      // A usable row needs at least a date or an origin, plus some volume or a party.
      if (!lrDate && !pickupLocation) {
        skipped++;
        continue;
      }
      if (!litres && !buckets && !partyName) {
        skipped++;
        continue;
      }

      const flags: string[] = [];
      const branch = deriveBranch(pickupLocation, sheetName);
      const destination = cleanString(get(row, 'destination'));

      let expected = parseDate(get(row, 'expectedDeliveryDate'));
      const actual = parseDate(get(row, 'actualDeliveryDate'));
      let dispatch = parseDate(get(row, 'dispatchDate'));

      // The September Sonipat tab carries expected dates in the PREVIOUS month
      // (LR 02-Sep, expected 04-Aug). An expected date before the LR date is
      // impossible, so drop it rather than report a fake on-time figure.
      if (expected && lrDate && expected < lrDate) {
        flag(flags, 'expected_before_lr');
        expected = null;
      }

      // Dispatch dates on the September tab are stamped 2025 against 2026 LRs.
      // Correct only the clear off-by-one-year case; anything else is left alone.
      if (dispatch && lrDate) {
        const gap = daysBetween(lrDate, dispatch);
        if (gap > 300 && gap < 430) {
          dispatch = new Date(
            Date.UTC(lrDate.getUTCFullYear(), dispatch.getUTCMonth(), dispatch.getUTCDate())
          );
          flag(flags, 'dispatch_year_corrected');
        }
      }

      let delayDays: number | null = null;
      let isOnTime: boolean | null = null;
      if (expected && actual) {
        delayDays = daysBetween(actual, expected);
        isOnTime = delayDays <= 0;
      }

      let dispatchToDeliveryDays: number | null = null;
      if (dispatch && actual) {
        const d = daysBetween(actual, dispatch);
        if (d >= 0) dispatchToDeliveryDays = d;
        else flag(flags, 'delivered_before_dispatch');
      }

      const materialRaw = cleanString(get(row, 'material'));
      const { packSizeLtr, sku, mismatch } = derivePack(buckets, litres, materialRaw);
      if (mismatch) flag(flags, 'pack_size_mismatch');
      if (buckets > 0 && litres === 0) flag(flags, 'missing_litres');
      if (!lrDate) flag(flags, 'missing_lr_date');

      const deliveryStatusRaw = cleanString(get(row, 'deliveryStatus'));
      const podStatusRaw = cleanString(get(row, 'podStatus'));
      const podStatus = normalisePodStatus(podStatusRaw);

      const damageRaw = cleanString(get(row, 'damage'));
      const damage = damageRaw ? /^(Y|TRUE|DAMAGE)/i.test(damageRaw) : false;

      const vehicleTypeRaw = get(row, 'vehicleType');
      const loadTypeRaw = cleanString(get(row, 'loadType'));
      const srNoValue = toNumber(get(row, 'srNo'));
      const vehicleNumber = cleanString(get(row, 'vehicleNumber'));
      const vendor = canonicaliseVendor(cleanString(get(row, 'vendorName')));
      if (vendor.aliased) flag(flags, 'vendor_alias_applied');
      const dispatchVehicle = cleanString(get(row, 'dispatchVehicle'));

      out.push({
        srNo: srNoValue > 0 ? srNoValue : null,
        sourceSheet: sheetName,
        branch,
        pickupLocation,
        partyName,
        destination,
        lane: destination ? `${branch} - ${titleCase(destination)}` : null,
        invoiceNumber: cleanString(get(row, 'invoiceNumber')),
        lrNo: cleanString(get(row, 'lrNo')),
        lrDate,
        material: materialRaw,
        materialSku: sku,
        packSizeLtr,
        buckets,
        totalQuantityLtr: litres,
        loadType: loadTypeRaw ? loadTypeRaw.toUpperCase() : null,
        expectedDeliveryDate: expected,
        actualDeliveryDate: actual,
        dispatchDate: dispatch,
        dispatchFrom: cleanString(get(row, 'dispatchFrom')),
        deliveryStatus: normaliseDeliveryStatus(deliveryStatusRaw),
        deliveryStatusRaw,
        lrStatus: cleanString(get(row, 'lrStatus')),
        damage,
        delayDays,
        isOnTime,
        dispatchToDeliveryDays,
        loadingCharges: toNumber(get(row, 'loadingCharges')),
        unloadingCharges: toNumber(get(row, 'unloadingCharges')),
        vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().replace(/\s+/g, '') : null,
        vehicleType:
          vehicleTypeRaw === null || vehicleTypeRaw === undefined
            ? null
            : String(vehicleTypeRaw).trim(),
        vendorName: vendor.name,
        dispatchVehicle: dispatchVehicle ? dispatchVehicle.toUpperCase().replace(/\s+/g, '') : null,
        routeCode: cleanString(get(row, 'routeCode')),
        ply: toNumber(get(row, 'ply')),
        podStatus,
        podStatusRaw,
        podReceived: podStatus === 'Received',
        monthKey: monthKeyOf(lrDate),
        remarks: cleanString(get(row, 'remarks')),
        dataFlags: flags.length ? flags.join(',') : null,
      });
      kept++;
    }

    sheets.push({ name: sheetName, branch: deriveBranch(null, sheetName), rows: kept, skipped });
  }

  return { rows: out, sheets, flagCounts, warnings };
}
