import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import {
  getDashboard,
  getFilterOptions,
  getShipments,
  getAllShipments,
  ShipmentFilters,
} from '../services/shipmentAnalytics';
import dashboardCache from '../services/cacheService';
import { logger } from '../utils/logger';

/**
 * Parse a YYYY-MM-DD query param into a UTC instant.
 * `to` is pushed to the end of the day so an inclusive range works as expected.
 */
function parseDate(v: unknown, endOfDay = false): Date | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d] = m;
  return endOfDay
    ? new Date(Date.UTC(+y, +mo - 1, +d, 23, 59, 59, 999))
    : new Date(Date.UTC(+y, +mo - 1, +d));
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'all' ? v.trim() : null;
}

function filtersFrom(req: Request): ShipmentFilters {
  return {
    from: parseDate(req.query.from),
    to: parseDate(req.query.to, true),
    branch: str(req.query.branch),
    vendor: str(req.query.vendor),
    sku: str(req.query.sku),
    loadType: str(req.query.loadType),
    deliveryStatus: str(req.query.deliveryStatus),
  };
}

/**
 * Whether carrier names must be pseudonymised for this request.
 *
 * Defaults to masked when req.auth is somehow absent: every /api route runs
 * behind authenticate(), so that cannot normally happen, and if it ever does
 * the safe answer is to hide names rather than to leak them.
 */
function maskedFor(req: Request): boolean {
  return req.auth?.masked ?? true;
}

/**
 * Cache key.
 *
 * `masked` is part of the key, and must stay that way. The cached value is a
 * fully-rendered payload with carrier names already either real or
 * pseudonymised, so a key that ignored the role would let the first HO request
 * populate an entry that a subsequent client request then reads - handing the
 * client exactly the names the masking exists to withhold.
 *
 * CACHE_VERSION changes whenever the key shape or payload shape changes, so
 * entries written by an older build can never be read back by a newer one.
 */
const CACHE_VERSION = 'v2';

function cacheKeyFor(f: ShipmentFilters, masked: boolean): string {
  return [
    CACHE_VERSION,
    'dash',
    masked ? 'masked' : 'real',
    f.from?.toISOString() ?? '',
    f.to?.toISOString() ?? '',
    f.branch ?? '',
    f.vendor ?? '',
    f.sku ?? '',
    f.loadType ?? '',
    f.deliveryStatus ?? '',
  ].join('|');
}

export const dashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const masked = maskedFor(req);
    const filters = filtersFrom(req);
    const key = cacheKeyFor(filters, masked);

    const cached = dashboardCache.get(key);
    if (cached) {
      res.json({ ...cached, meta: { ...cached.meta, cached: true } });
      return;
    }

    const data = await getDashboard(filters, masked);
    dashboardCache.set(key, data);
    res.json({ ...data, meta: { ...data.meta, cached: false } });
  } catch (err) {
    next(err);
  }
};

export const filterOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getFilterOptions(maskedFor(req)));
  } catch (err) {
    next(err);
  }
};

export const shipments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getShipments({
      ...filtersFrom(req),
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      pageSize: req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : 50,
      search: str(req.query.search),
      sortBy: str(req.query.sortBy),
      sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc',
    }, maskedFor(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/** Export the current filtered selection as an .xlsx download. */
export const exportShipments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // The export covers the entire filtered set, not just the page on screen.
    // A spreadsheet outlives the session it came from, so the Vendor column
    // here is masked for a client exactly as it is on screen.
    const rows = await getAllShipments(filtersFrom(req), maskedFor(req));

    const sheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        'SR NO': r.srNo,
        Branch: r.branch,
        'Party Name': r.partyName,
        Destination: r.destination,
        'Invoice Number': r.invoiceNumber,
        'LR No': r.lrNo,
        'LR Date': r.lrDate,
        Material: r.material,
        SKU: r.materialSku,
        Buckets: r.buckets,
        'Total Qty (L)': r.totalQuantityLtr,
        'Load Type': r.loadType,
        'Expected Delivery': r.expectedDeliveryDate,
        'Actual Delivery': r.actualDeliveryDate,
        'Delay (days)': r.delayDays,
        'Delivery Status': r.deliveryStatus,
        'POD Status': r.podStatus,
        Vendor: r.vendorName,
        'Vehicle Number': r.vehicleNumber,
        'Dispatch Date': r.dispatchDate,
        Remarks: r.remarks,
        'Data Flags': r.dataFlags,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Shipments');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="npl-shipments-${Date.now()}.xlsx"`);
    res.send(buf);
  } catch (err) {
    logger.error('Shipment export failed', { error: err });
    next(err);
  }
};
