import axios from 'axios';
import { env } from '../lib/runtimeEnv';
import { clearJwt, getJwt } from '../lib/appwriteJwt';

// VITE_API_URL is the backend ORIGIN, not the API base. Older env files shipped
// it with `/api` already appended, which made every request hit `/api/api/*`
// and 404. Strip a trailing slash and a trailing `/api` so both forms work.
//
// Read through runtimeEnv so a Coolify-injected value wins over whatever was
// compiled into the bundle.
//
// The default differs by build, and must: `vite dev` serves the SPA on 5173
// with the API on a separate origin, so it needs an absolute URL. A production
// build is served by nginx, which proxies /api on the SAME origin - so the
// default there is empty, making requests relative. Defaulting a production
// build to localhost:5000 would point every browser at the machine the user is
// sitting at.
const DEFAULT_API_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

const API_URL = env('VITE_API_URL', DEFAULT_API_URL)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const client = axios.create({ baseURL: `${API_URL}/api`, timeout: 60000 });

// Fallback credential for callers with no Appwrite session. It is compiled into
// a file the browser downloads, so it is not a secret and the backend treats it
// as the least-privileged role: shared-key requests always see masked carrier
// names. A signed-in user's JWT takes precedence over it below.
const API_KEY = env('VITE_API_KEY');

/**
 * Attach the caller's identity to every request.
 *
 * The Appwrite JWT is what the backend verifies to decide the role, and with it
 * whether the response carries real carrier names or pseudonyms. Minting is
 * cached and deduplicated in lib/appwriteJwt.
 */
client.interceptors.request.use(async (config) => {
  const jwt = await getJwt();
  const credential = jwt || API_KEY;
  if (credential) {
    config.headers.Authorization = `Bearer ${credential}`;
  }
  return config;
});

/**
 * A 401 usually means the JWT lapsed or the session was revoked. Drop the
 * cached token and retry once; a second failure is a genuine sign-out and is
 * passed through for the router to handle.
 */
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error?.config;
    if (error?.response?.status === 401 && config && !config.__retriedAfter401) {
      config.__retriedAfter401 = true;
      clearJwt();
      return client.request(config);
    }
    return Promise.reject(error);
  }
);

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

/**
 * Download the filtered selection as an .xlsx.
 *
 * This used to hand the browser a bare URL to navigate to. A top-level
 * navigation carries no Authorization header, so the request arrived
 * unauthenticated - which only worked while the API had no key set, and now
 * means the server cannot tell whether the caller may see real carrier names.
 * Fetching it through the same axios client puts the JWT on the request, so the
 * spreadsheet is masked or not according to the caller's actual role.
 */
export async function downloadExport(filters: DashboardFilters): Promise<void> {
  const { data, headers } = await client.get('/analytics/export', {
    params: params(filters),
    responseType: 'blob',
    timeout: 300000,
  });

  const disposition = String(headers['content-disposition'] ?? '');
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? `npl-shipments-${Date.now()}.xlsx`;

  const url = URL.createObjectURL(data as Blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoking immediately can cancel the download in some browsers; a tick is
    // enough for the click to have been dispatched.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// ---------------------------------------------------------------- identity

export type Role = 'ho' | 'client';

export interface Identity {
  userId: string | null;
  email: string | null;
  role: Role;
  via: 'appwrite-jwt' | 'api-key' | 'dev';
  /** Whether THIS session's responses carry pseudonymised carrier names. */
  masked: boolean;
  can: {
    seeCarrierNames: boolean;
    upload: boolean;
  };
}

/**
 * Ask the server who it thinks we are.
 *
 * The role is read from here rather than derived in the browser from Appwrite
 * team membership. The server already resolves it to decide masking, so taking
 * the answer from the same place keeps the UI from ever disagreeing with what
 * the API actually enforces.
 */
export async function fetchIdentity(): Promise<Identity> {
  const { data } = await client.get<Identity>('/me');
  return data;
}

export default client;
