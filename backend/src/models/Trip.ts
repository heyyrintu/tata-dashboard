import mongoose, { Document, Schema } from 'mongoose';

export interface ITrip extends Document {
  sNo: number;
  indentDate: Date;
  indent: string;
  allocationDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    sNo: { type: Number },
    indentDate: { type: Date, index: true },
    indent: { type: String, index: true },
    allocationDate: { type: Date, index: true },
    customerName: { type: String },
    location: { type: String },
    vehicleModel: { type: String },
    vehicleNumber: { type: String },
    vehicleBased: { type: String },
    lrNo: { type: String },
    material: { type: String },
    loadPerBucket: { type: Number },
    noOfBuckets: { type: Number },
    totalLoad: { type: Number },
    podReceived: { type: String },
    loadingCharge: { type: Number },
    unloadingCharge: { type: Number },
    actualRunning: { type: Number },
    billableRunning: { type: Number },
    range: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date range queries using indentDate
TripSchema.index({ indentDate: 1 });

export default mongoose.model<ITrip>('Trip', TripSchema);

