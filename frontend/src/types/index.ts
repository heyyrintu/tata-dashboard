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
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
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

