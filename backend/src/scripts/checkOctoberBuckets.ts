import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { format } from 'date-fns';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkOctoberBuckets() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    // October 2025 date range
    const octoberStart = new Date('2025-10-01');
    const octoberEnd = new Date('2025-10-31');
    octoberEnd.setHours(23, 59, 59, 999);

    console.log(`\n===== Checking October 2025 Bucket Count =====`);
    console.log(`Date range: ${octoberStart.toISOString().split('T')[0]} to ${octoberEnd.toISOString().split('T')[0]}`);

    // Get all indents
    const allIndents = await Trip.find({});
    console.log(`\nTotal indents in database: ${allIndents.length}`);

    // Filter for October using Freight Tiger Month (like the backend does)
    const normalizeFreightTigerMonth = (monthValue: string): string | null => {
      if (!monthValue || typeof monthValue !== 'string') return null;
      const trimmed = monthValue.trim();
      if (trimmed === '') return null;
      
      const fixedTrimmed = trimmed.replace(/^0ct/i, 'Oct');
      
      try {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          return format(parsed, 'yyyy-MM');
        }
      } catch (e) {}
      
      const monthPatterns = [
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i,
        /^(\d{1,2})[-/](\d{2,4})$/,
      ];
      
      for (const pattern of monthPatterns) {
        const match = fixedTrimmed.match(pattern);
        if (match) {
          let monthStr = match[1];
          let yearStr = match[2];
          
          const monthNames: { [key: string]: string } = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          
          if (monthNames[monthStr.toLowerCase()]) {
            monthStr = monthNames[monthStr.toLowerCase()];
          } else if (parseInt(monthStr) >= 1 && parseInt(monthStr) <= 12) {
            monthStr = monthStr.padStart(2, '0');
          } else {
            continue;
          }
          
          if (yearStr.length === 2) {
            const yearNum = parseInt(yearStr, 10);
            yearStr = yearNum >= 50 ? `19${yearStr}` : `20${yearStr}`;
          }
          
          return `${yearStr}-${monthStr}`;
        }
      }
      
      return null;
    };

    const targetMonthKey = '2025-10';
    
    // Filter using Freight Tiger Month (same logic as backend)
    const octoberIndents = allIndents.filter((indent: any) => {
      // Primary: Use Freight Tiger Month if available
      if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
        const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
        if (normalizedMonth === targetMonthKey) {
          return true;
        }
      }
      // Fallback: Use indentDate
      if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
        return indent.indentDate >= octoberStart && indent.indentDate <= octoberEnd;
      }
      return false;
    });

    console.log(`\nOctober indents (using Freight Tiger Month + indentDate fallback): ${octoberIndents.length}`);

    // Calculate bucket count
    let totalBuckets = 0;
    let totalBarrels = 0;
    const bucketRows: any[] = [];
    const barrelRows: any[] = [];

    octoberIndents.forEach((indent: any) => {
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      
      if (material === '20L Buckets') {
        totalBuckets += count;
        bucketRows.push({
          indent: indent.indent,
          indentDate: indent.indentDate,
          freightTigerMonth: indent.freightTigerMonth,
          noOfBuckets: count,
          range: indent.range
        });
      } else if (material === '210L Barrels') {
        totalBarrels += count;
        barrelRows.push({
          indent: indent.indent,
          indentDate: indent.indentDate,
          freightTigerMonth: indent.freightTigerMonth,
          noOfBuckets: count,
          range: indent.range
        });
      }
    });

    console.log(`\n===== RESULTS =====`);
    console.log(`Total Buckets: ${totalBuckets}`);
    console.log(`Total Barrels: ${totalBarrels}`);
    console.log(`Expected Buckets: 13,600`);
    console.log(`Difference: ${totalBuckets - 13600} buckets`);

    // Check for duplicates
    const indentCounts = new Map<string, number>();
    octoberIndents.forEach((indent: any) => {
      if (indent.indent) {
        indentCounts.set(indent.indent, (indentCounts.get(indent.indent) || 0) + 1);
      }
    });

    const duplicates = Array.from(indentCounts.entries()).filter(([_, count]) => count > 1);
    console.log(`\nDuplicate indents: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log(`Sample duplicates:`, duplicates.slice(0, 5));
    }

    // Show bucket rows with counts > 100 (to find the extra 100)
    const largeBucketRows = bucketRows.filter(r => r.noOfBuckets >= 100);
    console.log(`\nBucket rows with >= 100 buckets: ${largeBucketRows.length}`);
    if (largeBucketRows.length > 0) {
      console.log(`Sample large bucket rows:`, largeBucketRows.slice(0, 10).map(r => ({
        indent: r.indent,
        buckets: r.noOfBuckets,
        date: r.indentDate,
        freightTigerMonth: r.freightTigerMonth
      })));
    }

    // Check if there are any rows that might be incorrectly included
    console.log(`\n===== Checking for potential issues =====`);
    
    // Check for rows with Freight Tiger Month that might be incorrectly normalized
    const freightTigerRows = octoberIndents.filter((indent: any) => 
      indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string'
    );
    console.log(`Rows with Freight Tiger Month: ${freightTigerRows.length}`);
    
    const uniqueFreightTigerMonths = new Set(
      freightTigerRows.map((indent: any) => indent.freightTigerMonth)
    );
    console.log(`Unique Freight Tiger Month values:`, Array.from(uniqueFreightTigerMonths));

    // Check for rows that match by indentDate but not by Freight Tiger Month
    const dateOnlyRows = octoberIndents.filter((indent: any) => {
      if (!indent.freightTigerMonth || indent.freightTigerMonth.trim() === '') {
        return indent.indentDate >= octoberStart && indent.indentDate <= octoberEnd;
      }
      const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
      return normalizedMonth !== targetMonthKey && 
             indent.indentDate >= octoberStart && 
             indent.indentDate <= octoberEnd;
    });
    console.log(`\nRows matching by indentDate but NOT by Freight Tiger Month: ${dateOnlyRows.length}`);
    if (dateOnlyRows.length > 0) {
      const dateOnlyBuckets = dateOnlyRows
        .filter((indent: any) => (indent.material || '').trim() === '20L Buckets')
        .reduce((sum: number, indent: any) => sum + (indent.noOfBuckets || 0), 0);
      console.log(`Buckets from these rows: ${dateOnlyBuckets}`);
      console.log(`Sample rows:`, dateOnlyRows.slice(0, 5).map(r => ({
        indent: r.indent,
        indentDate: r.indentDate,
        freightTigerMonth: r.freightTigerMonth,
        material: r.material,
        noOfBuckets: r.noOfBuckets
      })));
    }

    // Check duplicate indents in detail
    console.log(`\n===== Detailed Duplicate Analysis =====`);
    duplicates.forEach(([indent, count]) => {
      const rows = octoberIndents.filter((r: any) => r.indent === indent);
      const bucketRows = rows.filter((r: any) => (r.material || '').trim() === '20L Buckets');
      const totalBucketsForIndent = bucketRows.reduce((sum: number, r: any) => sum + (r.noOfBuckets || 0), 0);
      console.log(`\nIndent: ${indent} (appears ${count} times)`);
      console.log(`  Bucket rows: ${bucketRows.length}`);
      console.log(`  Total buckets: ${totalBucketsForIndent}`);
      bucketRows.forEach((r: any, idx: number) => {
        console.log(`    Row ${idx + 1}: ${r.noOfBuckets} buckets, Date: ${r.indentDate}, Range: ${r.range}, Freight Tiger Month: ${r.freightTigerMonth}`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOctoberBuckets();

