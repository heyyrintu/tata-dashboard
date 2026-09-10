import axios from 'axios';
import { env } from '../lib/runtimeEnv';

// VITE_API_URL is the backend ORIGIN, not the API base. Older env files shipped
// it with `/api` already appended, which made every request hit `/api/api/*`
// and 404. Strip a trailing slash and a trailing `/api` so both forms work.
//
// Read through runtimeEnv so a Coolify-injected value wins over whatever was
// compiled into the bundle. In the single-container deployment this stays
// unset: nginx serves the SPA and proxies /api on the same origin, so the empty
// default resolves to a relative `/api`.
const API_URL = env('VITE_API_URL', 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const client = axios.create({ baseURL: `${API_URL}/api`, timeout: 60000 });

const API_KEY = env('VITE_API_KEY');
if (API_KEY) {
  client.defaults.headers.common.Authorization = `Bearer ${API_KEY}`;
}

// ---------------------------------------------------------------- types

export interface DashboardFilters {
  from?: string | null;
  to?: string | null;
  branch?: string | null;
  vendor?: string | null;
  sku?: string | null;
  loadType?: string | null;
  deliveryStatus?: string | null;
}

export interface Kpis {
  shipments: number;
  litres: number;
  buckets: number;
  onTimePct: number;
  onTimeMeasurable: number;
  onTimeLate: number;
  avgDelayDays: number;
  deliveredCount: number;
  deliveredPct: number;
  inTransitCount: number;
  pendingCount: number;
  returnedCount: number;
  returnedPct: number;
  podReceivedCount: number;
  podReceivedPct: number;
  podOutstandingCount: number;
  damageCount: number;
  avgTransitDays: number | null;
  branchCount: number;
  vendorCount: number;
  partyCount: number;
  vehicleCount: number;
  destinationCount: number;
}

export interface StatusSlice {
  status: string;
  count: number;
  litres: number;
  pct: number;
}

export interface BranchOnTime {
  branch: string;
  shipments: number;
  measurable: number;
  onTime: number;
  late: number;
  pct: number;
  avgDelayDays: number;
}

export interface MonthOnTime extends BranchOnTime {
  month: string;
}

export interface VolumePoint {
  date: string;
  shipments: number;
  litres: number;
  buckets: number;
}

export interface MonthVolume {
  month: string;
  shipments: number;
  litres: number;
  buckets: number;
  onTimePct: number;
}

export interface BranchVolume {
  branch: string;
  shipments: number;
  litres: number;
  buckets: number;
  onTimePct: number;
  podPct: number;
  avgTransitDays: number | null;
}

export interface VendorRow {
  vendor: string;
  shipments: number;
  litres: number;
  onTimePct: number;
  measurable: number;
  avgDelayDays: number;
  podPct: number;
  returns: number;
  vehicles: number;
  avgTransitDays: number | null;
  branches: string[];
}

export interface VehicleRow {
  vehicleNumber: string;
  trips: number;
  litres: number;
  onTimePct: number;
  avgTransitDays: number | null;
  vendor: string | null;
  branches: string[];
}

export interface LaneRow {
  lane: string;
  branch: string | null;
  destination: string | null;
  km: number | null;
  shipments: number;
  litres: number;
  onTimePct: number;
  measurable: number;
  avgTransitDays: number | null;
}

export interface DataQualityRow {
  flag: string;
  count: number;
  pct: number;
  label: string;
  impact: string;
}

export interface ScorecardRow {
  kpi: string;
  actual: number | null;
  target: number;
  unit: string;
  higherIsBetter: boolean;
  status: 'on-target' | 'close' | 'gap' | 'no-data';
}

export interface FlowSummary {
  received: number;
  receivedLitres: number;
  dispatched: number;
  dispatchedLitres: number;
  delivered: number;
  deliveredLitres: number;
  inTransit: number;
  atWarehouse: number;
  onTime: number;
  late: number;
  dispatchCompliancePct: number;
  tatSplit: {
    warehouseDwellDays: number | null;
    roadDays: number | null;
    totalDays: number | null;
    dwellSharePct: number | null;
  };
}

export interface BusinessUnitRow {
  bu: string;
  shipments: number;
  litres: number;
  pctShipments: number;
  pctLitres: number;
  ftlShipments: number;
  ftlLitres: number;
  ptlShipments: number;
  ptlLitres: number;
  onTimePct: number;
}

export interface DropSizeRow {
  bucket: string;
  shipments: number;
  litres: number;
  pctShipments: number;
  pctLitres: number;
}

export interface CycleTime {
  measured: number;
  avgDays: number | null;
  medianDays: number | null;
  withinTargetPct: number;
  histogram: { days: number; label: string; count: number }[];
}

export interface PerDayRow {
  date: string;
  incoming: number;
  outgoing: number;
  incomingLitres: number;
  outgoingLitres: number;
}

export interface BacklogRow {
  date: string;
  cumulativeReceived: number;
  cumulativeDispatched: number;
  open: number;
}

export interface FlowRates {
  avgIncomingPerDay: number;
  avgIncomingLitresPerDay: number;
  avgOutgoingPerDay: number;
  avgOutgoingLitresPerDay: number;
  peakOpenOrders: number;
}

export interface WeeklyRow {
  week: string;
  weekStart: string;
  shipments: number;
  litres: number;
  onTimePct: number;
  measurable: number;
}

export interface WeekdayRow {
  day: string;
  incoming: number;
  outgoing: number;
}

export interface DistanceBandRow {
  band: string;
  shipments: number;
  litres: number;
  pctShipments: number;
  pctLitres: number;
  onTimePct: number;
  measurable: number;
  avgTatDays: number | null;
  avgDwellDays: number | null;
  avgRoadDays: number | null;
  delivered: number;
}

export interface ZoneRow {
  zone: string;
  shipments: number;
  litres: number;
  pctLitres: number;
  onTimePct: number;
  measurable: number;
  avgTatDays: number | null;
  destinations: number;
}

export interface TripSummary {
  total: number;
  capacityLtr: number;
  avgLitresPerTrip: number | null;
  avgShipmentsPerTrip: number | null;
  avgFillPct: number;
  mix: { bucket: string; trips: number }[];
  unassignedShipments: number;
}

export interface DashboardPayload {
  meta: {
    totalRows: number;
    filteredRows: number;
    truncated: boolean;
    dateRange: { from: string; to: string } | null;
    generatedAt: string;
    cached?: boolean;
  };
  kpis: Kpis;
  deliveryStatus: StatusSlice[];
  pod: {
    byStatus: StatusSlice[];
    ageing: { bucket: string; count: number }[];
    byBranch: { branch: string; shipments: number; received: number; outstanding: number; pct: number }[];
  };
  onTime: {
    byBranch: BranchOnTime[];
    byMonth: MonthOnTime[];
    delayDistribution: { bucket: string; count: number }[];
  };
  volume: {
    byDay: VolumePoint[];
    byMonth: MonthVolume[];
    byBranch: BranchVolume[];
    bySku: { sku: string; shipments: number; litres: number; buckets: number }[];
    byLoadType: { loadType: string; shipments: number; litres: number; pct: number }[];
    topParties: { party: string; shipments: number; litres: number; onTimePct: number }[];
    topDestinations: { destination: string; shipments: number; litres: number }[];
  };
  vendors: VendorRow[];
  vehicles: VehicleRow[];
  lanes: LaneRow[];
  flow: FlowSummary;
  scorecard: ScorecardRow[];
  businessUnit: BusinessUnitRow[];
  dropSize: DropSizeRow[];
  cycleTime: CycleTime;
  perDay: PerDayRow[];
  backlog: BacklogRow[];
  flowRates: FlowRates;
  weekly: WeeklyRow[];
  weekday: WeekdayRow[];
  distanceBands: DistanceBandRow[];
  zones: ZoneRow[];
  trips: TripSummary;
  dataQuality: DataQualityRow[];
}

export interface FilterOptions {
  branches: string[];
  vendors: string[];
  skus: string[];
  loadTypes: string[];
  deliveryStatuses: string[];
  dateRange: { from: string | null; to: string | null };
}

export interface Shipment {
  id: number;
  srNo: number | null;
  branch: string | null;
  partyName: string | null;
  destination: string | null;
  invoiceNumber: string | null;
  lrNo: string | null;
  lrDate: string | null;
  material: string | null;
  materialSku: string | null;
  buckets: number | null;
  totalQuantityLtr: number | null;
  loadType: string | null;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  dispatchDate: string | null;
  deliveryStatus: string | null;
  podStatus: string | null;
  vendorName: string | null;
  vehicleNumber: string | null;
  vehicleType: string | null;
  delayDays: number | null;
  isOnTime: boolean | null;
  remarks: string | null;
  dataFlags: string | null;
}

export interface ShipmentPage {
  rows: Shipment[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface UploadResult {
  success: boolean;
  recordCount: number;
  fileName?: string;
  message: string;
  error?: string;
  sheets?: { name: string; branch: string; rows: number; skipped: number }[];
  flagCounts?: Record<string, number>;
  warnings?: string[];
}

// ---------------------------------------------------------------- calls

/** Drop null/empty filter values so they never reach the query string. */
function params(f: object): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = String(v);
  }
  return out;
}

export async function fetchDashboard(filters: DashboardFilters): Promise<DashboardPayload> {
  const { data } = await client.get<DashboardPayload>('/analytics', { params: params(filters) });
  return data;
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data } = await client.get<FilterOptions>('/analytics/filters');
  return data;
}

export async function fetchShipments(
  filters: DashboardFilters & { page?: number; pageSize?: number; search?: string | null; sortBy?: string | null; sortDir?: 'asc' | 'desc' }
): Promise<ShipmentPage> {
  const { data } = await client.get<ShipmentPage>('/analytics/shipments', { params: params(filters) });
  return data;
}

export async function uploadWorkbook(file: File, onProgress?: (pct: number) => void): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post<UploadResult>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

/** Build the export URL so the browser can download it directly. */
export function exportUrl(filters: DashboardFilters): string {
  const qs = new URLSearchParams(params(filters)).toString();
  return `${API_URL}/api/analytics/export${qs ? `?${qs}` : ''}`;
}

export default client;
