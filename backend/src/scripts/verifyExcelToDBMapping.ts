import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';
import * as path from 'path';

interface ColumnMapping {
  excelColumn: string;
  excelIndex: number;
  excelLetter: string;
  dbField: string;
  dbType: string;
  status: 'MATCH' | 'MISMATCH' | 'MISSING' | 'EXTRA';
  notes?: string;
}

// Expected mapping based on Trip model
const expectedMappings: Array<{ dbField: string; dbType: string; excelHeaders: string[]; index?: number }> = [
  { dbField: 'sNo', dbType: 'Number', excelHeaders: ['S.No', 'S.No.', 'SNo'], index: 0 },
  { dbField: 'indentDate', dbType: 'Date', excelHeaders: ['Indent Date', 'IndentDate', 'Indent  Date'], index: 1 },
  { dbField: 'indent', dbType: 'String', excelHeaders: ['Indent', 'INDENT'], index: 2 },
  { dbField: 'allocationDate', dbType: 'Date', excelHeaders: ['Allocation Date', 'AllocationDate', 'Allocation  Date'], index: 3 },
  { dbField: 'customerName', dbType: 'String', excelHeaders: ['Customer Name', 'CustomerName', 'Customer  Name'], index: 4 },
  { dbField: 'location', dbType: 'String', excelHeaders: ['Location', 'LOCATION'], index: 5 },
  { dbField: 'vehicleModel', dbType: 'String', excelHeaders: ['Vehicle Model', 'VehicleModel', 'Vehicle  Model'], index: 6 },
  { dbField: 'vehicleNumber', dbType: 'String', excelHeaders: ['Vehicle Number', 'VehicleNumber', 'Vehicle  Number'], index: 7 },
  { dbField: 'vehicleBased', dbType: 'String', excelHeaders: ['Vehicle Based', 'VehicleBased', 'Vehicle  Based'], index: 8 },
  { dbField: 'lrNo', dbType: 'String', excelHeaders: ['LR No', 'LRNo', 'LR  No', 'LR No.'], index: 9 },
  { dbField: 'material', dbType: 'String', excelHeaders: ['Material', 'MATERIAL'], index: 10 },
  { dbField: 'loadPerBucket', dbType: 'Number', excelHeaders: ['Load/Bucket', 'Load Per Bucket'], index: 11 },
  { dbField: 'noOfBuckets', dbType: 'Number', excelHeaders: ['No. of Buckets', 'No of Buckets', 'No.Of Buckets'], index: 12 },
  { dbField: 'totalLoad', dbType: 'Number', excelHeaders: ['Total Load', 'TotalLoad', 'Total  Load'], index: 13 },
  { dbField: 'podReceived', dbType: 'String', excelHeaders: ['POD Received', 'PODReceived', 'POD  Received'], index: 14 },
  { dbField: 'loadingCharge', dbType: 'Number', excelHeaders: ['Loading Charge', 'LoadingCharge', 'Loading  Charge'], index: 15 },
  { dbField: 'unloadingCharge', dbType: 'Number', excelHeaders: ['Unloading Charge', 'UnloadingCharge', 'Unloading  Charge'], index: 16 },
  { dbField: 'actualRunning', dbType: 'Number', excelHeaders: ['Actual Running', 'ActualRunning', 'Actual  Running'], index: 17 },
  { dbField: 'billableRunning', dbType: 'Number', excelHeaders: ['Billable Running', 'BillableRunning', 'Billable  Running'], index: 18 },
  { dbField: 'range', dbType: 'String', excelHeaders: ['Range'], index: 19 },
  { dbField: 'totalKm', dbType: 'Number', excelHeaders: ['Total Km ( TpT)', 'Total Km (TpT)', 'Total Km', 'Total KM'], index: 20 },
  { dbField: 'remarks', dbType: 'String', excelHeaders: ['Remarks'], index: 21 },
  { dbField: 'freightTigerMonth', dbType: 'String', excelHeaders: ['Freight Tiger Month', 'FreightTigerMonth'], index: 22 },
  { dbField: 'totalCostAE', dbType: 'Number', excelHeaders: ['Total Cost_1', 'Total Cost'], index: 30 },
  { dbField: 'profitLoss', dbType: 'Number', excelHeaders: ['P & L', 'P&L', 'Profit Loss'], index: 36 },
];

function normalizeColumnName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function indexToColumnLetter(index: number): string {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
}

const verifyExcelToDBMapping = async () => {
  try {
    console.log('========================================');
    console.log('EXCEL TO DATABASE HEADER MAPPING VERIFICATION');
    console.log('========================================\n');

    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // Read Excel file
    const excelPath = path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx');
    console.log(`Reading Excel file: ${excelPath}\n`);

    const workbook = XLSX.readFile(excelPath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true
    });
    
    const targetSheetName = 'OPs Data';
    const sheetName = workbook.SheetNames.includes(targetSheetName) ? targetSheetName : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false,
      header: 1  // Get raw headers
    });
    
    if (jsonData.length === 0) {
      console.log('⚠️  ERROR: Excel file has no data!');
      await mongoose.disconnect();
      return;
    }

    // Get headers from first row
    const excelHeaders: string[] = jsonData[0] as string[];
    console.log(`Excel Sheet: "${sheetName}"`);
    console.log(`Total Excel columns: ${excelHeaders.length}\n`);

    // Get database schema fields
    const dbSchema = Trip.schema.obj;
    const dbFields = Object.keys(dbSchema).filter(field => 
      !['createdAt', 'updatedAt', '__v'].includes(field)
    );
    
    console.log(`Database fields: ${dbFields.length}\n`);

    // Create mapping
    const mappings: ColumnMapping[] = [];
    const matchedExcelColumns = new Set<string>();

    // Check each expected mapping
    for (const expected of expectedMappings) {
      let foundExcelColumn: string | null = null;
      let foundIndex = -1;

      // Try to find by header name
      for (let i = 0; i < excelHeaders.length; i++) {
        const header = normalizeColumnName(String(excelHeaders[i] || ''));
        for (const expectedHeader of expected.excelHeaders) {
          if (normalizeColumnName(expectedHeader) === header || 
              header.toLowerCase().includes(expectedHeader.toLowerCase().replace(/\s+/g, ' '))) {
            foundExcelColumn = String(excelHeaders[i]);
            foundIndex = i;
            matchedExcelColumns.add(String(excelHeaders[i]));
            break;
          }
        }
        if (foundExcelColumn) break;
      }

      // If not found by name, try by index
      if (!foundExcelColumn && expected.index !== undefined && excelHeaders.length > expected.index) {
        foundExcelColumn = String(excelHeaders[expected.index]);
        foundIndex = expected.index;
        matchedExcelColumns.add(foundExcelColumn);
      }

      const status: ColumnMapping['status'] = foundExcelColumn ? 'MATCH' : 'MISSING';
      
      mappings.push({
        excelColumn: foundExcelColumn || 'NOT FOUND',
        excelIndex: foundIndex,
        excelLetter: foundIndex >= 0 ? indexToColumnLetter(foundIndex) : 'N/A',
        dbField: expected.dbField,
        dbType: expected.dbType,
        status,
        notes: foundExcelColumn ? undefined : `Expected at index ${expected.index || 'unknown'}`
      });
    }

    // Check for extra Excel columns (not mapped to DB)
    const extraColumns: ColumnMapping[] = [];
    for (let i = 0; i < excelHeaders.length; i++) {
      const header = String(excelHeaders[i] || '').trim();
      if (header && !matchedExcelColumns.has(header)) {
        extraColumns.push({
          excelColumn: header,
          excelIndex: i,
          excelLetter: indexToColumnLetter(i),
          dbField: 'N/A',
          dbType: 'N/A',
          status: 'EXTRA',
          notes: 'Not mapped to database'
        });
      }
    }

    // Print results
    console.log('========================================');
    console.log('MAPPING RESULTS');
    console.log('========================================\n');

    console.log('MATCHED COLUMNS:');
    console.log('─'.repeat(100));
    const matched = mappings.filter(m => m.status === 'MATCH');
    matched.forEach(m => {
      console.log(`✓ ${m.excelLetter.padEnd(4)} | ${m.excelColumn.padEnd(30)} → ${m.dbField.padEnd(20)} (${m.dbType})`);
    });
    console.log(`\nTotal matched: ${matched.length}/${expectedMappings.length}\n`);

    if (mappings.some(m => m.status === 'MISSING')) {
      console.log('MISSING COLUMNS (Expected but not found in Excel):');
      console.log('─'.repeat(100));
      const missing = mappings.filter(m => m.status === 'MISSING');
      missing.forEach(m => {
        console.log(`✗ ${m.excelLetter.padEnd(4)} | ${m.dbField.padEnd(20)} (${m.dbType}) - ${m.notes || 'Not found'}`);
      });
      console.log(`\nTotal missing: ${missing.length}\n`);
    }

    if (extraColumns.length > 0) {
      console.log('EXTRA COLUMNS (In Excel but not mapped to DB):');
      console.log('─'.repeat(100));
      extraColumns.forEach(m => {
        console.log(`⚠ ${m.excelLetter.padEnd(4)} | ${m.excelColumn.padEnd(30)} - ${m.notes || 'Not used'}`);
      });
      console.log(`\nTotal extra: ${extraColumns.length}\n`);
    }

    // Verify database sample
    console.log('========================================');
    console.log('DATABASE SAMPLE VERIFICATION');
    console.log('========================================\n');
    
    const sampleTrip = await Trip.findOne({}).lean();
    if (sampleTrip) {
      console.log('Sample database record fields:');
      Object.keys(sampleTrip).forEach(key => {
        if (!['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) {
          const value = sampleTrip[key as keyof typeof sampleTrip];
          const type = typeof value;
          const displayValue = value instanceof Date 
            ? value.toISOString().split('T')[0]
            : String(value).substring(0, 50);
          console.log(`  ${key.padEnd(20)} (${type}): ${displayValue}`);
        }
      });
    } else {
      console.log('⚠️  No records in database to verify');
    }

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');
    console.log(`Excel columns: ${excelHeaders.length}`);
    console.log(`Database fields: ${dbFields.length}`);
    console.log(`Matched mappings: ${matched.length}/${expectedMappings.length}`);
    console.log(`Missing mappings: ${mappings.filter(m => m.status === 'MISSING').length}`);
    console.log(`Extra Excel columns: ${extraColumns.length}`);
    
    if (matched.length === expectedMappings.length && mappings.filter(m => m.status === 'MISSING').length === 0) {
      console.log('\n✅ SUCCESS: All expected mappings are present!');
    } else {
      console.log('\n⚠️  WARNING: Some mappings are missing or incorrect!');
    }

    console.log('\n========================================');
    console.log('VERIFICATION COMPLETE');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

verifyExcelToDBMapping();

