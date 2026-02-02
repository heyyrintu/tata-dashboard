/**
 * Debug comparison utility to compare month-on-month vs getAnalytics vs calculateRangeWiseSummary
 * This helps identify why values don't match
 */

import prisma from '../lib/prisma';
import { format } from 'date-fns';
import { normalizeFreightTigerMonth } from './freightTigerMonth';

export async function debugCompareCalculations(monthKey: string) {
  console.log(`\n========== DEBUG COMPARISON FOR MONTH: ${monthKey} ==========\n`);
  
  // Create month boundaries exactly like month-on-month
  const monthStart = new Date(monthKey + '-01');
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  console.log(`Month boundaries: ${monthStart.toISOString()} to ${monthEnd.toISOString()}\n`);
  
  // Get all indents
  const allIndents = await prisma.trip.findMany();
  console.log(`Total indents in DB: ${allIndents.length}\n`);
  
  // ===== MONTH-ON-MONTH LOGIC =====
  console.log('--- MONTH-ON-MONTH LOGIC ---');
  let allIndentsForMonth = allIndents.filter(indent => {
    if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
      const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
      if (normalizedMonth === monthKey) {
        return true;
      }
      if (normalizedMonth === null) {
        // Fall through
      } else {
        return false;
      }
    }
    if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
      return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
    }
    return false;
  });
  
  if (allIndentsForMonth.length === 0) {
    allIndentsForMonth = allIndents.filter(indent => {
      if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) return false;
      return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
    });
  }
  
  const validIndentsForMonth = allIndentsForMonth.filter(indent => indent.range && indent.range.trim() !== '');
  
  const monthOnMonthIndentCount = new Set(allIndentsForMonth.filter(t => t.indent).map(t => t.indent)).size;
  const monthOnMonthTripCount = new Set(validIndentsForMonth.filter(t => t.indent).map(t => t.indent)).size;
  
  console.log(`All indents for month: ${allIndentsForMonth.length}`);
  console.log(`Valid indents for month: ${validIndentsForMonth.length}`);
  console.log(`Indent Count (Card 1): ${monthOnMonthIndentCount}`);
  console.log(`Trip Count (Card 2): ${monthOnMonthTripCount}\n`);
  
  // ===== GETANALYTICS LOGIC =====
  console.log('--- GETANALYTICS LOGIC ---');
  let allIndentsFiltered = [...allIndents];
  
  allIndentsFiltered = allIndentsFiltered.filter(indent => {
    if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
      const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
      if (normalizedMonth === monthKey) {
        return true;
      }
      if (normalizedMonth !== null && normalizedMonth !== monthKey) {
        return false;
      }
    }
    if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
      if (indent.indentDate >= monthStart && indent.indentDate <= monthEnd) {
        return true;
      }
    }
    return false;
  });
  
  if (allIndentsFiltered.length === 0) {
    allIndentsFiltered = allIndents.filter(indent => {
      if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) return false;
      return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
    });
  }
  
  const validIndents = allIndentsFiltered.filter(indent => indent.range && indent.range.trim() !== '');
  
  const getAnalyticsIndentCount = new Set(allIndentsFiltered.filter(t => t.indent).map(t => t.indent)).size;
  const getAnalyticsTripCount = new Set(validIndents.filter(t => t.indent).map(t => t.indent)).size;
  
  console.log(`All indents filtered: ${allIndentsFiltered.length}`);
  console.log(`Valid indents: ${validIndents.length}`);
  console.log(`Indent Count (Card 1): ${getAnalyticsIndentCount}`);
  console.log(`Trip Count (Card 2): ${getAnalyticsTripCount}\n`);
  
  // ===== COMPARISON =====
  console.log('--- COMPARISON ---');
  console.log(`Indent Count Match: ${monthOnMonthIndentCount === getAnalyticsIndentCount ? '✓' : '✗'} (Month-on-Month: ${monthOnMonthIndentCount}, getAnalytics: ${getAnalyticsIndentCount})`);
  console.log(`Trip Count Match: ${monthOnMonthTripCount === getAnalyticsTripCount ? '✓' : '✗'} (Month-on-Month: ${monthOnMonthTripCount}, getAnalytics: ${getAnalyticsTripCount})`);
  console.log(`All indents count match: ${allIndentsForMonth.length === allIndentsFiltered.length ? '✓' : '✗'} (Month-on-Month: ${allIndentsForMonth.length}, getAnalytics: ${allIndentsFiltered.length})`);
  console.log(`Valid indents count match: ${validIndentsForMonth.length === validIndents.length ? '✓' : '✗'} (Month-on-Month: ${validIndentsForMonth.length}, getAnalytics: ${validIndents.length})\n`);
  
  // Show differences
  if (allIndentsForMonth.length !== allIndentsFiltered.length) {
    console.log('--- DIFFERENCES IN ALL INDENTS ---');
    const monthOnMonthSet = new Set(allIndentsForMonth.map(i => i.id?.toString()));
    const getAnalyticsSet = new Set(allIndentsFiltered.map(i => i.id?.toString()));
    
    const onlyInMonthOnMonth = allIndentsForMonth.filter(i => !getAnalyticsSet.has(i.id?.toString()));
    const onlyInGetAnalytics = allIndentsFiltered.filter(i => !monthOnMonthSet.has(i.id?.toString()));
    
    if (onlyInMonthOnMonth.length > 0) {
      console.log(`Indents only in Month-on-Month (${onlyInMonthOnMonth.length}):`);
      onlyInMonthOnMonth.slice(0, 5).forEach(i => {
        console.log(`  - Indent: ${i.indent}, FreightTigerMonth: ${i.freightTigerMonth}, IndentDate: ${i.indentDate?.toISOString()}`);
      });
    }
    
    if (onlyInGetAnalytics.length > 0) {
      console.log(`Indents only in getAnalytics (${onlyInGetAnalytics.length}):`);
      onlyInGetAnalytics.slice(0, 5).forEach(i => {
        console.log(`  - Indent: ${i.indent}, FreightTigerMonth: ${i.freightTigerMonth}, IndentDate: ${i.indentDate?.toISOString()}`);
      });
    }
  }
  
  console.log(`\n========== END DEBUG COMPARISON ==========\n`);
}

