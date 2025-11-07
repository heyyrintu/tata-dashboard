import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';

dotenv.config();

async function checkSeptemberIndents() {
  try {
    await connectDatabase();
    console.log('Connected to database\n');

    // Get all indents from September 2025
    const septemberStart = new Date(2025, 8, 1); // September 1, 2025 (month is 0-indexed)
    const septemberEnd = new Date(2025, 8, 31, 23, 59, 59, 999); // September 30, 2025

    console.log(`[September Indent Count] Date range: ${septemberStart.toISOString().split('T')[0]} to ${septemberEnd.toISOString().split('T')[0]}\n`);

    // Get ALL indents from September (including duplicates)
    const allSeptemberIndents = await Trip.find({
      indentDate: {
        $gte: septemberStart,
        $lte: septemberEnd
      }
    });

    console.log(`[September Indent Count] ===== RESULTS =====`);
    console.log(`Total rows in September (including duplicates): ${allSeptemberIndents.length}`);
    
    // Count unique indent values
    const uniqueIndentValues = new Set(
      allSeptemberIndents
        .map(indent => indent.indent)
        .filter(Boolean)
    );
    console.log(`Unique indent values: ${uniqueIndentValues.size}`);
    console.log(`Duplicate rows: ${allSeptemberIndents.length - uniqueIndentValues.size}\n`);

    // Show sample indents
    console.log(`[September Indent Count] Sample indents (first 10):`);
    allSeptemberIndents.slice(0, 10).forEach((indent, index) => {
      console.log(`${index + 1}. Indent: ${indent.indent || 'N/A'}, Date: ${indent.indentDate ? indent.indentDate.toISOString().split('T')[0] : 'N/A'}, Load: ${indent.totalLoad || 0} kg`);
    });

    // Count by indent value (to see which indents have duplicates)
    const indentCounts = new Map<string, number>();
    allSeptemberIndents.forEach(indent => {
      const indentValue = indent.indent || 'N/A';
      indentCounts.set(indentValue, (indentCounts.get(indentValue) || 0) + 1);
    });

    // Show indents with duplicates
    const duplicates = Array.from(indentCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (duplicates.length > 0) {
      console.log(`\n[September Indent Count] Top 10 indents with duplicates:`);
      duplicates.forEach(([indent, count]) => {
        console.log(`  ${indent}: ${count} rows`);
      });
    }

    // Total load from September
    const totalLoad = allSeptemberIndents.reduce((sum, indent) => {
      return sum + (indent.totalLoad || 0);
    }, 0);
    console.log(`\n[September Indent Count] Total load from all September indents: ${totalLoad} kg (${(totalLoad / 1000).toFixed(2)} tons)`);
    console.log(`[September Indent Count] ====================================`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSeptemberIndents();

