# Dashboard Calculation Logic Documentation

This document explains how all calculations are performed in the TATA Dashboard system.

## Table of Contents

1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Date Filtering Logic](#date-filtering-logic)
4. [Summary Cards Calculations](#summary-cards-calculations)
5. [Range-Wise Summary Calculations](#range-wise-summary-calculations)
6. [Revenue, Cost, and Profit/Loss Calculations](#revenue-cost-and-profitloss-calculations)
7. [Fulfillment Analytics Calculations](#fulfillment-analytics-calculations)
8. [Month-on-Month Calculations](#month-on-month-calculations)
9. [Important Notes](#important-notes)

---

## Overview

The dashboard processes trip/indent data from Excel files and calculates various metrics. The system distinguishes between:
- **All Indents**: Includes cancelled indents (those with blank "Range" column)
- **Valid Indents**: Excludes cancelled indents (only indents with non-blank "Range" column)

---

## Data Sources

### Database Fields Used

- `indent`: Unique indent identifier
- `indentDate`: Date when indent was created
- `freightTigerMonth`: Month value from Freight Tiger system (e.g., "May'25", "Oct-25")
- `range`: Distance range (0-100Km, 101-250Km, 251-400Km, 401-600Km, or blank for cancelled)
- `material`: Material type ("20L Buckets" or "210L Barrels")
- `noOfBuckets`: Number of buckets/barrels
- `totalLoad`: Total load in kilograms
- `totalCost`: Total cost (loading + unloading + running charges)
- `profitLoss`: Profit or loss amount
- `location`: Delivery location
- `vehicleNumber`: Vehicle number
- `remarks`: Additional remarks

---

## Date Filtering Logic

### Single Month Filter

When the date range represents a **single month** (e.g., May 1-31, 2025):

1. **Primary Method**: Use `freightTigerMonth` column
   - Normalize month value to `yyyy-MM` format (e.g., "May'25" → "2025-05")
   - Match indents where normalized month equals target month
   
2. **Fallback Method**: If no matches found, use `indentDate`
   - Filter indents where `indentDate` falls within the month range

### Multi-Month or Date Range Filter

When the date range spans **multiple months** or is a custom range:

1. **Primary Method**: Use `indentDate`
   - Filter indents where `indentDate >= fromDate AND indentDate <= toDate`
   
2. **Fallback Method**: Also check `freightTigerMonth`
   - If `freightTigerMonth` normalized month falls within the date range, include the indent

### No Date Filter

If no date filter is applied (`fromDate = null, toDate = null`):
- Include **ALL** indents from the database

### Date Filtering Implementation

**Location**: `backend/src/utils/rangeWiseCalculations.ts` and `backend/src/controllers/analyticsController.ts`

```typescript
// Single month detection
const fromMonth = format(fromDate, 'yyyy-MM');
const toMonth = format(toDate, 'yyyy-MM');

if (fromMonth === toMonth) {
  // Use Freight Tiger Month
} else {
  // Use indentDate with Freight Tiger Month fallback
}
```

---

## Summary Cards Calculations

### Card 1: Total Indents

**Formula**: Count of unique indent values from **ALL indents** (including cancelled)

**Steps**:
1. Filter ALL indents by date (using date filtering logic above)
2. Extract unique `indent` values
3. Count unique values

**Code Location**: `backend/src/controllers/analyticsController.ts` (getAnalytics)

```typescript
const allIndentsFiltered = allIndents.filter(/* date filter */);
const uniqueIndents = new Set(allIndentsFiltered.map(t => t.indent));
const totalIndents = uniqueIndents.size;
```

**Note**: This includes cancelled indents (those with blank range).

---

### Card 2: Total Trip

**Formula**: Count of unique indent values from **valid indents only** (excluding cancelled)

**Steps**:
1. Filter ALL indents by date
2. Filter to only include indents with non-blank `range` (excludes cancelled)
3. Extract unique `indent` values
4. Count unique values

**Code Location**: `backend/src/controllers/analyticsController.ts` (getAnalytics)

```typescript
const validIndents = allIndentsFiltered.filter(indent => 
  indent.range && indent.range.trim() !== ''
);
const uniqueIndentsForCard2 = new Set(validIndents.map(t => t.indent));
const totalTrips = uniqueIndentsForCard2.size;
```

**Note**: This excludes cancelled indents.

---

### Card 3: Total Load

**Formula**: Sum of `totalLoad` from **ALL indents** in date range (including duplicates and cancelled)

**Steps**:
1. Get ALL indents in date range (including cancelled and duplicates)
2. Sum all `totalLoad` values
3. Convert from kilograms to tons (divide by 1000)

**Code Location**: 
- Backend: `backend/src/utils/rangeWiseCalculations.ts` (calculateRangeWiseSummary)
- Frontend: `frontend/src/components/SummaryCards.tsx`

```typescript
// Backend
const allIndentsInDateRange = /* all indents matching date filter */;
const totalLoad = allIndentsInDateRange.reduce((sum, indent) => 
  sum + (indent.totalLoad || 0), 0
);

// Frontend
const totalLoadKg = rangeData?.totalLoad || 0;
const totalLoad = totalLoadKg / 1000; // Convert to tons
```

**Note**: Includes ALL rows, including duplicates and cancelled indents.

---

### Card 4: Bucket & Barrel Count

**Formula**: Count buckets and barrels separately from **valid indents only** (excluding cancelled)

**Steps**:
1. Filter valid indents by date (exclude cancelled)
2. For each indent:
   - If `material === "20L Buckets"`: Count `noOfBuckets` as buckets
   - If `material === "210L Barrels"`: Count `noOfBuckets` as barrels
3. Sum buckets and barrels separately
4. Exclude "Other" and "Duplicate Indents" rows from totals

**Code Location**: 
- Backend: `backend/src/utils/rangeWiseCalculations.ts` (calculateRangeWiseSummary)
- Frontend: `frontend/src/components/SummaryCards.tsx`

```typescript
// Backend - in range calculation
rangeIndents.forEach((indent) => {
  const count = indent.noOfBuckets || 0;
  const material = (indent.material || '').trim();
  
  if (material === '20L Buckets') {
    bucketCount += count;
  } else if (material === '210L Barrels') {
    barrelCount += count;
  }
});

// Total buckets/barrels exclude "Other" and "Duplicate Indents"
const standardRanges = rangeData.filter(item => 
  item.range !== 'Other' && item.range !== 'Duplicate Indents'
);
const totalBuckets = standardRanges.reduce((sum, item) => sum + item.bucketCount, 0);
const totalBarrels = standardRanges.reduce((sum, item) => sum + item.barrelCount, 0);
```

**Note**: 
- Buckets and barrels are counted separately (no conversion)
- Only from valid indents (excludes cancelled)
- Excludes "Other" and "Duplicate Indents" from totals

---

### Card 5: Avg Buckets/Trip

**Formula**: (Total Buckets + Barrels converted to buckets) / Total Trip

**Steps**:
1. Get total buckets from Card 4
2. Get total barrels from Card 4
3. Convert barrels to buckets: `barrels * 10.5` (1 barrel = 10.5 buckets)
4. Add: `totalBuckets + (totalBarrels * 10.5)`
5. Divide by Total Trip (Card 2)
6. Round to nearest integer

**Code Location**: `frontend/src/components/SummaryCards.tsx`

```typescript
const totalBucketsIncludingBarrels = totalBuckets + (totalBarrels * 10.5);
const avgBucketsPerTrip = metrics.totalIndentsUnique > 0 
  ? totalBucketsIncludingBarrels / metrics.totalIndentsUnique 
  : 0;
const avgBucketsPerTripRounded = Math.round(avgBucketsPerTrip);
```

**Note**: Uses Card 2 (Total Trip) as denominator, which excludes cancelled indents.

---

## Range-Wise Summary Calculations

### Range Data Structure

Each range contains:
- `range`: Range label (0-100Km, 101-250Km, 251-400Km, 401-600Km, Other)
- `indentCount`: Total rows in this range (including duplicates)
- `uniqueIndentCount`: Unique indent values in this range
- `totalLoad`: Total load in kg for this range
- `percentage`: Percentage of total rows
- `bucketCount`: Total buckets in this range
- `barrelCount`: Total barrels in this range
- `totalCost`: Total cost for this range
- `profitLoss`: Total profit/loss for this range

### Range Calculation Steps

1. **Filter Valid Indents**: Get indents with non-blank range, filtered by date
2. **Group by Range**: Group indents into predefined ranges:
   - 0-100Km
   - 101-250Km
   - 251-400Km
   - 401-600Km
   - Other (any range not matching above)
3. **Calculate Metrics per Range**:
   - Count total rows (indentCount)
   - Count unique indents (uniqueIndentCount)
   - Sum total load
   - Calculate percentage: `(indentCount / totalRows) * 100`
   - Count buckets and barrels separately
   - Sum total cost and profit/loss

**Code Location**: `backend/src/utils/rangeWiseCalculations.ts` (calculateRangeWiseSummary)

```typescript
const rangeMappings = [
  { label: '0-100Km' },
  { label: '101-250Km' },
  { label: '251-400Km' },
  { label: '401-600Km' },
];

const rangeData = rangeMappings.map(({ label }) => {
  const rangeIndents = validIndents.filter(indent => indent.range === label);
  
  const indentCount = rangeIndents.length;
  const uniqueIndentCount = new Set(rangeIndents.map(t => t.indent)).size;
  const totalLoadInRange = rangeIndents.reduce((sum, indent) => 
    sum + (indent.totalLoad || 0), 0
  );
  const percentage = (indentCount / totalRows) * 100;
  
  // Count buckets and barrels
  let bucketCount = 0;
  let barrelCount = 0;
  rangeIndents.forEach((indent) => {
    const count = indent.noOfBuckets || 0;
    const material = (indent.material || '').trim();
    if (material === '20L Buckets') bucketCount += count;
    else if (material === '210L Barrels') barrelCount += count;
  });
  
  return {
    range: label,
    indentCount,
    uniqueIndentCount,
    totalLoad: totalLoadInRange,
    percentage: parseFloat(percentage.toFixed(2)),
    bucketCount,
    barrelCount,
    totalCost: /* sum of costs */,
    profitLoss: /* sum of profit/loss */
  };
});
```

### Total Row Calculation

The Range-Wise Summary table shows a "Total" row that:
- **Excludes** "Other" and "Duplicate Indents" rows
- Sums only the 4 standard ranges (0-100Km, 101-250Km, 251-400Km, 401-600Km)

**Code Location**: `frontend/src/components/RangeWiseTable.tsx`

```typescript
const standardRanges = data.rangeData.filter(item => 
  item.range !== 'Other' && item.range !== 'Duplicate Indents'
);

const totalIndents = standardRanges.reduce((sum, item) => 
  sum + (item.uniqueIndentCount ?? item.indentCount), 0
);
const totalLoad = standardRanges.reduce((sum, item) => sum + item.totalLoad, 0);
const totalBuckets = standardRanges.reduce((sum, item) => sum + item.bucketCount, 0);
const totalBarrels = standardRanges.reduce((sum, item) => sum + item.barrelCount, 0);
```

### Duplicate Indents Row

If an indent appears in multiple ranges, it's counted in a "Duplicate Indents" row:

1. Find indents that appear in 2+ different ranges
2. Count all rows for these duplicate indents
3. Calculate metrics (load, buckets, barrels, cost, profit/loss)
4. Add as separate row in range data

**Code Location**: `backend/src/utils/rangeWiseCalculations.ts`

```typescript
// Find indents in multiple ranges
const indentRangeMap = new Map<string, Set<string>>();
validIndents.forEach((indent) => {
  if (indent.indent && indent.range) {
    if (!indentRangeMap.has(indent.indent)) {
      indentRangeMap.set(indent.indent, new Set());
    }
    indentRangeMap.get(indent.indent)!.add(indent.range);
  }
});

// Find duplicates
const duplicateIndents = new Set<string>();
indentRangeMap.forEach((ranges, indent) => {
  if (ranges.size > 1) {
    duplicateIndents.add(indent);
  }
});
```

---

## Revenue, Cost, and Profit/Loss Calculations

### Revenue Calculation

**Formula**: (Bucket Count × Bucket Rate) + (Barrel Count × Barrel Rate)

**Rates by Range**:
- **0-100Km**: Bucket = ₹21, Barrel = ₹220.5
- **101-250Km**: Bucket = ₹40, Barrel = ₹420
- **251-400Km**: Bucket = ₹68, Barrel = ₹714
- **401-600Km**: Bucket = ₹105, Barrel = ₹1081.5

**Steps**:
1. Filter valid indents by date
2. Group by range
3. For each range:
   - Count buckets (material = "20L Buckets")
   - Count barrels (material = "210L Barrels")
   - Calculate: `(buckets × bucketRate) + (barrels × barrelRate)`
4. Sum all ranges for total revenue

**Code Location**: `backend/src/controllers/analyticsController.ts` (getRevenueAnalytics)

```typescript
const BUCKET_RATES = {
  '0-100Km': 21,
  '101-250Km': 40,
  '251-400Km': 68,
  '401-600Km': 105
};

const BARREL_RATES = {
  '0-100Km': 220.5,
  '101-250Km': 420,
  '251-400Km': 714,
  '401-600Km': 1081.5
};

rangeIndents.forEach(indent => {
  const count = indent.noOfBuckets || 0;
  const material = (indent.material || '').trim();
  
  if (material === '20L Buckets') {
    bucketCount += count;
    bucketRevenue += count * BUCKET_RATES[label];
  } else if (material === '210L Barrels') {
    barrelCount += count;
    barrelRevenue += count * BARREL_RATES[label];
  }
});

const totalRevenue = bucketRevenue + barrelRevenue;
```

---

### Cost Calculation

**Formula**: Sum of `totalCost` from **ALL indents** in date range

**Steps**:
1. Get ALL indents in date range (including cancelled and duplicates)
2. Sum all `totalCost` values

**Code Location**: `backend/src/utils/rangeWiseCalculations.ts` and `backend/src/controllers/analyticsController.ts`

```typescript
// Total cost from ALL indents (including duplicates and cancelled)
const totalCost = allIndentsInDateRange.reduce((sum, indent) => 
  sum + (indent.totalCost || 0), 0
);

// Cost by range (from valid indents only)
const costByRange = rangeMappings.map(({ label }) => {
  const rangeIndents = indents.filter(indent => indent.range === label);
  const totalCost = rangeIndents.reduce((sum, indent) => 
    sum + (indent.totalCost || 0), 0
  );
  return { range: label, cost: totalCost };
});
```

**Note**: Total cost includes ALL rows (duplicates + cancelled), but cost by range uses only valid indents.

---

### Profit/Loss Calculation

**Formula**: Revenue - Cost

**Steps**:
1. Calculate total revenue (from valid indents)
2. Get total cost (from ALL indents)
3. Subtract: `totalRevenue - totalCost`

**Code Location**: 
- Backend: `backend/src/utils/rangeWiseCalculations.ts`
- Frontend: `frontend/src/components/phase4/ProfitLossCard.tsx`

```typescript
// Backend
const totalProfitLoss = allIndentsInDateRange.reduce((sum, indent) => 
  sum + (indent.profitLoss || 0), 0
);

// Frontend (alternative calculation)
const totalRevenue = /* calculate from range data */;
const totalCost = rangeData?.totalCost || 0;
const profitLoss = totalRevenue - totalCost;
```

**Note**: 
- Revenue is calculated from valid indents only
- Cost includes ALL indents (duplicates + cancelled)
- Profit/Loss can be calculated either way (from database field or Revenue - Cost)

---

## Fulfillment Analytics Calculations

### Bucket Range Groups

Indents are grouped by bucket count into ranges:
- **0 - 150**: 0 to 150 buckets
- **151 - 200**: 151 to 200 buckets
- **201 - 250**: 201 to 250 buckets
- **251 - 300**: 251 to 300 buckets
- **300+ (Other)**: More than 300 buckets

### Bucket Count Calculation

**Formula**: 
- If `material === "20L Buckets"`: `bucketCount = noOfBuckets`
- If `material === "210L Barrels"`: `bucketCount = noOfBuckets * 10.5` (convert barrels to buckets)
- Otherwise: `bucketCount = 0`

**Steps**:
1. Filter valid indents by date (exclude cancelled)
2. For each indent:
   - Calculate bucket count based on material type
   - Assign to appropriate bucket range
3. Count trips using vehicle-day logic (same vehicle, same day = 1 trip)

**Code Location**: `backend/src/controllers/analyticsController.ts` (getFulfillmentAnalytics)

```typescript
const bucketRanges = [
  { min: 0, max: 150, label: '0 - 150' },
  { min: 151, max: 200, label: '151 - 200' },
  { min: 201, max: 250, label: '201 - 250' },
  { min: 251, max: 300, label: '251 - 300' }
];

for (const indent of indents) {
  const material = (indent.material || '').trim();
  const noOfBuckets = indent.noOfBuckets || 0;
  let bucketCount = 0;
  
  if (material === '20L Buckets') {
    bucketCount = noOfBuckets;
  } else if (material === '210L Barrels') {
    bucketCount = noOfBuckets * 10.5; // Convert to buckets
  }
  
  // Assign to range
  for (const range of bucketRanges) {
    if (bucketCount >= range.min && bucketCount <= range.max) {
      // Add to this range
      break;
    }
  }
}

// Calculate trip count using vehicle-day logic
const { totalTrips } = calculateTripsByVehicleDay(group.allIndents);
```

### Trip Count Logic (Vehicle-Day)

**Formula**: Count unique combinations of (vehicleNumber, indentDate)

**Steps**:
1. Group indents by vehicle number and date
2. Count unique (vehicle, date) combinations
3. This gives the actual number of trips

**Code Location**: `backend/src/utils/tripCount.ts`

```typescript
export function calculateTripsByVehicleDay(indents: TripDocument[]): { totalTrips: number } {
  const vehicleDaySet = new Set<string>();
  
  indents.forEach(indent => {
    if (indent.vehicleNumber && indent.indentDate) {
      const key = `${indent.vehicleNumber}_${format(indent.indentDate, 'yyyy-MM-dd')}`;
      vehicleDaySet.add(key);
    }
  });
  
  return { totalTrips: vehicleDaySet.size };
}
```

**Note**: This ensures that if the same vehicle makes multiple deliveries on the same day, it's counted as 1 trip.

---

## Month-on-Month Calculations

### Month Detection

**Primary Method**: Use `freightTigerMonth` column
- Normalize to `yyyy-MM` format
- Group indents by normalized month

**Fallback Method**: Use `indentDate`
- Extract year-month from `indentDate`
- Group by `yyyy-MM`

### Indent Count (Month-on-Month)

**Formula**: Count unique indents from **ALL indents** (including cancelled) for each month

**Steps**:
1. For each month:
   - Filter ALL indents to that month (using Freight Tiger Month or indentDate)
   - Count unique indent values
2. Format month label as "MMM'yy" (e.g., "May'25")

**Code Location**: `backend/src/controllers/analyticsController.ts` (getMonthOnMonthAnalytics)

```typescript
const monthOnMonthData = sortedMonthKeys.map(monthKey => {
  // Filter ALL indents to this month
  let allIndentsForMonth = allIndents.filter(indent => {
    if (indent.freightTigerMonth) {
      const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth);
      if (normalizedMonth === monthKey) return true;
    }
    // Fallback to indentDate
    if (indent.indentDate) {
      return format(indent.indentDate, 'yyyy-MM') === monthKey;
    }
    return false;
  });
  
  // Count unique indents (including cancelled)
  const uniqueIndents = new Set(allIndentsForMonth.map(t => t.indent));
  const indentCount = uniqueIndents.size;
  
  return {
    month: formatMonthLabel(monthKey),
    indentCount,
    tripCount: /* see below */
  };
});
```

### Trip Count (Month-on-Month)

**Formula**: Count unique indents from **valid indents only** (excluding cancelled) for each month

**Steps**:
1. For each month:
   - Filter ALL indents to that month
   - Filter to only include valid indents (non-blank range)
   - Count unique indent values

```typescript
const validIndentsForMonth = allIndentsForMonth.filter(indent => 
  indent.range && indent.range.trim() !== ''
);
const uniqueIndentsForTrips = new Set(validIndentsForMonth.map(t => t.indent));
const tripCount = uniqueIndentsForTrips.size;
```

**Note**: 
- Indent Count includes cancelled
- Trip Count excludes cancelled
- This matches Card 1 and Card 2 logic respectively

---

## Important Notes

### Data Inclusion Rules

1. **Total Load, Total Cost, Total Profit/Loss**:
   - Include **ALL rows** in date range
   - Includes duplicates and cancelled indents
   - Reason: These represent actual physical quantities/costs

2. **Total Indents (Card 1)**:
   - Includes cancelled indents
   - Counts unique indent values from ALL indents

3. **Total Trip (Card 2)**:
   - Excludes cancelled indents
   - Counts unique indent values from valid indents only

4. **Bucket/Barrel Counts**:
   - Excludes cancelled indents
   - Counts from valid indents only
   - Buckets and barrels counted separately (no conversion in totals)
   - Excludes "Other" and "Duplicate Indents" from totals

### Date Filtering Priority

1. **Single Month**: Freight Tiger Month → indentDate fallback
2. **Multi-Month**: indentDate → Freight Tiger Month fallback
3. **No Filter**: Show all data

### Conversion Factors

- **Load**: 1000 kg = 1 ton
- **Barrels to Buckets**: 1 barrel = 10.5 buckets (for Avg Buckets/Trip calculation)
- **Buckets and Barrels**: Counted separately in most calculations (no conversion)

### Special Rows

- **"Other"**: Indents with range not matching standard 4 ranges
- **"Duplicate Indents"**: Indents appearing in multiple ranges
- Both are excluded from total row calculations

### File Locations

- **Backend Calculations**: 
  - `backend/src/controllers/analyticsController.ts`
  - `backend/src/utils/rangeWiseCalculations.ts`
  - `backend/src/utils/tripCount.ts`
  - `backend/src/utils/dateFilter.ts`

- **Frontend Display**:
  - `frontend/src/components/SummaryCards.tsx`
  - `frontend/src/components/RangeWiseTable.tsx`
  - `frontend/src/hooks/useRangeData.ts`
  - `frontend/src/hooks/useRevenueData.ts`

---

## Summary

The dashboard uses a two-tier system:
1. **All Indents**: For physical quantities (load, cost) - includes everything
2. **Valid Indents**: For operational metrics (trips, buckets) - excludes cancelled

Date filtering intelligently uses Freight Tiger Month for single-month views and indentDate for ranges, ensuring accurate month-on-month comparisons while maintaining flexibility for custom date ranges.

