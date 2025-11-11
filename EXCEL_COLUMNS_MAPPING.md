# Excel Columns Mapping - Database Storage

## Overview
This document shows which Excel columns are parsed and stored in the database during the upload process.

## Excel Sheet
- **Sheet Name**: `OPs Data` (falls back to first sheet if not found)

## Columns Parsed and Stored in Database

### Column Mapping (Excel Column → Database Field)

| Excel Column | Column Letter | Index | Database Field | Type | Notes |
|-------------|---------------|-------|----------------|------|-------|
| S.No | A | 0 | `sNo` | Number | Serial number |
| Indent Date | B | 1 | `indentDate` | Date | Used for date filtering |
| Indent | C | 2 | `indent` | String | Unique indent identifier |
| Allocation Date | D | 3 | `allocationDate` | Date | |
| Customer Name | E | 4 | `customerName` | String | |
| Location | F | 5 | `location` | String | |
| Vehicle Model | G | 6 | `vehicleModel` | String | |
| **Vehicle Number** | **H** | **7** | **`vehicleNumber`** | **String** | **⭐ Used for Vehicle Cost Table** |
| Vehicle Based | I | 8 | `vehicleBased` | String | |
| LR No | J | 9 | `lrNo` | String | |
| Material | K | 10 | `material` | String | (e.g., "20L Buckets", "210L Barrels") |
| Load/Bucket | L | 11 | `loadPerBucket` | Number | |
| No. of Buckets | M | 12 | `noOfBuckets` | Number | |
| Total Load | N | 13 | `totalLoad` | Number | (in kg) |
| POD Received | O | 14 | `podReceived` | String | |
| Loading Charge | P | 15 | `loadingCharge` | Number | |
| Unloading Charge | Q | 16 | `unloadingCharge` | Number | |
| Actual Running | R | 17 | `actualRunning` | Number | |
| Billable Running | S | 18 | `billableRunning` | Number | |
| Range | T | 19 | `range` | String | (e.g., "0-100Km", "101-250Km") |
| **Total Km ( TpT)** | **U** | **20** | **`totalKm`** | **Number** | **⭐ Used for Vehicle Cost Table** |
| Remarks | V | 21 | `remarks` | String | |
| Freight Tiger Month | W | 22 | `freightTigerMonth` | String | |
| ... (columns X, Y, Z, AA, AB, AC, AD) | ... | 23-29 | - | - | Not stored |
| **Total Cost** | **AE** | **30** | **`totalCostAE`** | **Number** | Main total cost |
| ... (columns AF) | ... | 31-35 | - | - | Not stored |
| **P & L** | **AG** | **36** | **`profitLoss`** | **Number** | Profit & Loss |

## Special Columns for Vehicle Cost Table

### Vehicle Number (Column H)
- **Excel Header**: "Vehicle Number" (or variations: "VehicleNumber", "Vehicle  Number")
- **Database Field**: `vehicleNumber`
- **Usage**: Used to identify fixed vehicles:
  - HR38AC7854
  - HR38AC7243
  - HR38AC0599
  - HR38AC0263
  - HR38X6465
- **Matching**: Case-insensitive matching in vehicle cost calculations

### Total Km (Column U)
- **Excel Header**: "Total Km ( TpT)" (or variations)
- **Database Field**: `totalKm`
- **Usage**: Summed per vehicle to calculate Actual KM
- **Fallback**: If header not found, uses column at index 20 (Column U)

## Database Schema (Trip Model)

All fields are stored in MongoDB with the following structure:

```typescript
{
  sNo: number,
  indentDate: Date,           // Indexed
  indent: string,             // Indexed
  allocationDate: Date,       // Indexed
  customerName: string,
  location: string,
  vehicleModel: string,
  vehicleNumber: string,       // ⭐ For Vehicle Cost
  vehicleBased: string,
  lrNo: string,
  material: string,
  loadPerBucket: number,
  noOfBuckets: number,
  totalLoad: number,
  podReceived: string,
  loadingCharge: number,
  unloadingCharge: number,
  actualRunning: number,
  billableRunning: number,
  range: string,
  remarks: string,
  freightTigerMonth: string,
  totalCostAE: number,        // From Column AE
  profitLoss: number,         // From Column AG
  totalKm: number,            // ⭐ From Column U - For Vehicle Cost
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## Column Name Matching

The parser uses flexible column name matching:
- Handles variations in spacing (e.g., "Vehicle Number" vs "VehicleNumber")
- Case-insensitive matching
- Falls back to column index if name not found
- Normalizes whitespace and special characters

## Data Flow

1. **Excel Upload** → `uploadController.ts`
2. **Excel Parsing** → `excelParser.ts`
   - Reads "OPs Data" sheet
   - Maps columns by name (with fallback to index)
   - Parses and normalizes values
3. **Database Storage** → MongoDB `Trip` collection
   - All fields stored as per schema above
4. **Vehicle Cost Calculation** → `vehicleCostCalculations.ts`
   - Reads `vehicleNumber` (Column H)
   - Reads `totalKm` (Column U)
   - Aggregates by vehicle number

