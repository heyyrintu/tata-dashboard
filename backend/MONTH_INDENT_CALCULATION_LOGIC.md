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

### Step 2: Identify Unique Months
```typescript
const monthKeys = new Set<string>();
allIndents.forEach(indent => {
  if (indent.freightTigerMonth) {
    const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth);
    if (normalizedMonth) monthKeys.add(normalizedMonth);
  } else if (indent.indentDate) {
    monthKeys.add(format(indent.indentDate, 'yyyy-MM'));
  }
});
```
- Groups **ALL** indents by month using `freightTigerMonth` first, then `indentDate` as a fallback.
- Format: `'yyyy-MM'` (e.g., `'2025-05'` for May 2025)
- Creates a sorted list of unique months.

### Step 3: Calculate for Each Month

For each month (e.g., `'2025-05'`):

#### 3a. Filter Indents to This Month
```typescript
// Use the standard date filtering utility
const dateFilterResult = filterIndentsByDate(allIndents, monthStart, monthEnd);

// All indents (including cancelled) for this month
const allIndentsForMonth = dateFilterResult.allIndentsFiltered;

// Valid indents (excluding cancelled) for this month
const validIndentsForMonth = dateFilterResult.validIndents;
```
- The `filterIndentsByDate` utility correctly filters all indents to the specified month.
- It provides two lists: one with ALL indents, and one with only VALID indents (non-blank range).

#### 3b. Calculate INDENT COUNT (Card 1 Logic)
```typescript
// Use ALL indents for this month (including cancelled)
const uniqueIndents = new Set(allIndentsForMonth.map(t => t.indent));
const indentCount = uniqueIndents.size;
```

**Example:**
- Month has 5 rows with indent values: `['A', 'A', 'B', 'B', 'C']`, where 'C' is a cancelled indent.
- Unique indents: `['A', 'B', 'C']`
- **Indent Count = 3** (not 5)

**Key Points:**
- Counts **UNIQUE indent values** from **ALL indents** (including cancelled).
- If same indent appears multiple times, it counts as 1.
- This matches **Card 1 (Total Indents)** logic exactly.

#### 3c. Calculate TRIP COUNT (Card 2 Logic)
```typescript
// Use VALID indents for this month (excluding cancelled)
const uniqueIndentsForTrips = new Set(validIndentsForMonth.map(t => t.indent));
const tripCount = uniqueIndentsForTrips.size;
```

**Key Points:**
- Counts **UNIQUE indent values** from **VALID indents** (excluding cancelled).
- This matches **Card 2 (Total Trip)** logic exactly.

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

The month-on-month graph **should match** the cards because it uses the exact same calculation utilities (`filterIndentsByDate` and `calculateCardValues`) that the main cards use.

- **Indent Count** uses all indents (including cancelled), matching **Card 1**.
- **Trip Count** uses valid indents (excluding cancelled), matching **Card 2**.

---

## Code Location

- **Month-on-Month Calculation**: `backend/src/controllers/analyticsController.ts` → `getMonthOnMonthAnalytics()`
- **Card Calculation**: `backend/src/controllers/analyticsController.ts` → `getAnalytics()`
- **Trip Counting Logic**: `backend/src/utils/tripCount.ts` → `calculateTripsByVehicleDay()`

---

## Summary

**For each month:**
1. Filter indents to that month's date range.
2. **Indent Count** = Count of unique indent values from **ALL** indents (including cancelled).
3. **Trip Count** = Count of unique indent values from **VALID** indents (excluding cancelled).

This ensures the month-on-month graphs show the same values as the cards when filtered to that specific month.

