# Month-Based Indent Calculation Logic

This document explains exactly how indent counts and trip counts are calculated per month for the month-on-month graphs.

## Overview

The month-on-month graphs use the **EXACT SAME LOGIC** as the cards (Total Indents and Total Trip), but applied to each month individually.

---

## Step-by-Step Calculation Process

### Step 1: Query All Trips
```typescript
const allIndents = await Trip.find({});
```
- Fetches ALL trips from the database (no date filter)
- Shows all available months

### Step 2: Filter Valid Indents
```typescript
const validIndents = allIndents.filter(indent => 
  indent.range && indent.range.trim() !== ''
);
```
- **Only includes indents that have a Range value**
- **Excludes canceled indents** (canceled indents don't have a range)
- This is the same filter used in `getAnalytics`

### Step 3: Identify Unique Months
```typescript
const monthKeys = new Set<string>();
validIndents.forEach(indent => {
  if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
    monthKeys.add(format(indent.indentDate, 'yyyy-MM'));
  }
});
```
- Groups all valid indents by month using `indentDate`
- Format: `'yyyy-MM'` (e.g., `'2025-05'` for May 2025)
- Creates a sorted list of unique months

### Step 4: Calculate for Each Month

For each month (e.g., `'2025-05'`):

#### 4a. Define Month Date Range
```typescript
const monthStart = new Date(monthKey + '-01');  // e.g., '2025-05-01'
const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
monthEnd.setHours(23, 59, 59, 999);
```
- **Start**: First day of month at 00:00:00
- **End**: Last day of month at 23:59:59.999
- Example: May 2025 = `2025-05-01 00:00:00` to `2025-05-31 23:59:59.999`

#### 4b. Filter Indents to This Month
```typescript
const monthIndents = validIndents.filter(indent => {
  if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
    return false;
  }
  return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
});
```
- Filters `validIndents` to only include indents within this month's date range
- Uses `indentDate` field (NOT `allocationDate`)
- **Date comparison**: `>= monthStart` AND `<= monthEnd`

#### 4c. Calculate INDENT COUNT (Card 1 Logic)
```typescript
// Step 1: Filter to only indents with valid indent value
const indentsWithValue = monthIndents.filter(t => t.indent);

// Step 2: Extract unique indent values
const uniqueIndents = new Set(indentsWithValue.map(t => t.indent));

// Step 3: Count unique values
const indentCount = uniqueIndents.size;
```

**Example:**
- Month has 5 rows with indent values: `['A', 'A', 'B', 'B', 'C']`
- Unique indents: `['A', 'B', 'C']`
- **Indent Count = 3** (not 5)

**Key Points:**
- Counts **UNIQUE indent values**, not total rows
- If same indent appears multiple times in the month, it counts as 1
- This matches **Card 1 (Total Indents)** logic exactly

#### 4d. Calculate TRIP COUNT (Card 2 Logic)
```typescript
// Step 1: Map to trip documents
const tripDocuments = monthIndents.map(indent => ({
  indentDate: indent.indentDate,
  vehicleNumber: indent.vehicleNumber,
  remarks: indent.remarks
}));

// Step 2: Apply vehicle-day trip counting logic
const { totalTrips } = calculateTripsByVehicleDay(
  tripDocuments,
  monthStart,
  monthEnd
);
```

**Vehicle-Day Trip Counting Logic:**
1. **Group by**: Vehicle Number + Date (normalized)
2. **Count trips**:
   - If remarks contains "2ND TRIP" → count as **2 trips**
   - Otherwise → count as **1 trip**
3. **Filter**: Only include trips within month date range

**Example:**
- Vehicle `HR38AC7243` on `2025-05-10` with no "2ND TRIP" → **1 trip**
- Vehicle `HR38AC0599` on `2025-05-10` with "2ND TRIP" → **2 trips**
- Total for month = sum of all vehicle-day trips

**Key Points:**
- Uses vehicle-day grouping logic
- Accounts for "2nd trip" rule
- This matches **Card 2 (Total Trip)** logic exactly

---

## Date Field Used

**Both calculations use `indentDate`:**
- ✅ `indentDate` - Used for filtering and grouping
- ❌ `allocationDate` - NOT used for month calculations

This ensures consistency with the cards, which also use `indentDate` for filtering.

---

## Comparison with Cards

When you filter the dashboard to **May 2025**:

| Source | Indent Count | Trip Count |
|--------|--------------|------------|
| **Card 1 (Total Indents)** | 56 | - |
| **Card 2 (Total Trip)** | - | 51 |
| **Month-on-Month Graph (May'25)** | 56 | 51 |

The month-on-month graph **should match** the cards because:
1. Same date filtering (May 1-31, 2025)
2. Same valid indent filter (must have range)
3. Same calculation logic (unique indents, vehicle-day trips)

---

## Code Location

- **Month-on-Month Calculation**: `backend/src/controllers/analyticsController.ts` → `getMonthOnMonthAnalytics()`
- **Card Calculation**: `backend/src/controllers/analyticsController.ts` → `getAnalytics()`
- **Trip Counting Logic**: `backend/src/utils/tripCount.ts` → `calculateTripsByVehicleDay()`

---

## Summary

**For each month:**
1. Filter valid indents (must have range) to that month's date range
2. **Indent Count** = Count of unique indent values
3. **Trip Count** = Vehicle-day trip count with "2nd trip" rule

This ensures the month-on-month graphs show the same values as the cards when filtered to that specific month.

