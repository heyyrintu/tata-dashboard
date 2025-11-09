export interface IndentData {
  sNo: number;
  indentDate: string;
  indent: string;
  allocationDate: string;
  customerName: string;
  location: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleBased: string;
  lrNo: string;
  material: string;
  loadPerBucket: number;
  noOfBuckets: number;
  totalLoad: number;
  podReceived: string;
  loadingCharge: number;
  unloadingCharge: number;
  actualRunning: number;
  billableRunning: number;
  range: string;
}

export interface Analytics {
  success: boolean;
  totalIndents: number;
  totalIndentsUnique: number;
  totalLoad?: number; // Total load in kg (from ALL indents, including cancelled)
  totalBuckets?: number; // From valid indents only, excluding Other/Duplicate
  totalBarrels?: number; // From valid indents only, excluding Other/Duplicate
  avgBucketsPerTrip?: number; // Rounded average
  totalCost?: number; // From ALL indents, including cancelled
  totalProfitLoss?: number; // From ALL indents, including cancelled
  dateRange: {
    from: string | null;
    to: string | null;
  };
  recordsProcessed: number;
}

export interface UploadResponse {
  success: boolean;
  recordCount: number;
  fileName: string;
  message: string;
}

export interface RangeWiseData {
  range: string;
  indentCount: number;
  uniqueIndentCount?: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
  totalCost?: number;
  profitLoss?: number;
}

export interface LocationData {
  name: string;
  indentCount: number;
  totalLoad: number;
  range: string;
  lat?: number;
  lng?: number;
}

export interface RangeWiseResponse {
  success: boolean;
  rangeData: RangeWiseData[];
  locations: LocationData[];
  totalUniqueIndents?: number;
  totalLoad?: number;
  totalCost?: number;
  totalProfitLoss?: number;
  totalBuckets?: number;
  totalBarrels?: number;
  totalRows?: number;
  totalLoadDetails?: {
    totalRows: number;
    rowsWithLoad: number;
    rowsWithoutRange: number;
    uniqueIndents: number;
    duplicates: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

// Revenue Analysis Types
export interface RevenueByRange {
  range: string;
  bucketRate: number;
  barrelRate: number;
  bucketCount: number;
  barrelCount: number;
  bucketRevenue: number;
  barrelRevenue: number;
  revenue: number;
}

export interface RevenueOverTime {
  date: string;
  revenue: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalBuckets: number;
  revenuePerIndent: number;
  revenuePerBucket: number;
  avgBucketsPerIndent: number;
}

export interface RevenueBreakdown {
  range: string;
  revenue: number;
  percentage: number;
  color: string;
}

export interface RevenueAnalyticsResponse {
  success: boolean;
  revenueByRange: RevenueByRange[];
  totalRevenue: number;
  revenueOverTime: RevenueOverTime[];
  granularity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

