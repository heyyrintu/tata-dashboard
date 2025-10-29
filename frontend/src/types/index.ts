export interface TripData {
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
  totalTrips: number;
  totalIndents: number;
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
  tripCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
}

export interface LocationData {
  name: string;
  tripCount: number;
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

