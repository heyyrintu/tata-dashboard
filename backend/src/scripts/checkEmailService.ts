import dotenv from 'dotenv';

// Load environment variables FIRST before importing services
dotenv.config();

import { connectDatabase } from '../config/database';
import emailService from '../services/emailService';
import { processAllUnreadEmails } from '../utils/emailProcessor';

async function checkEmailService() {
  console.log('=== Email Service Diagnostic ===\n');

  // Connect to MongoDB first
  console.log('0. Connecting to MongoDB...');
  try {
    await connectDatabase();
    // Wait a moment for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✓ MongoDB connected and ready\n');
  } catch (error: any) {
    console.log(`   ⚠️  MongoDB connection failed: ${error.message}`);
    console.log('   ⚠️  Email service will still test, but processing may fail\n');
    console.log('   💡 Make sure MongoDB is running: mongod (or MongoDB service)');
  }

  // Check environment variables
  console.log('1. Checking Environment Variables:');
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenantId = process.env.OUTLOOK_TENANT_ID;
  const uploadEmail = process.env.OUTLOOK_UPLOAD_EMAIL;
  const pollInterval = process.env.OUTLOOK_POLL_INTERVAL;
  const nodeEnv = process.env.NODE_ENV;

  console.log(`   OUTLOOK_CLIENT_ID: ${clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET'}`);
  console.log(`   OUTLOOK_CLIENT_SECRET: ${clientSecret ? 'SET (hidden)' : 'NOT SET'}`);
  console.log(`   OUTLOOK_TENANT_ID: ${tenantId ? `${tenantId.substring(0, 8)}...` : 'NOT SET'}`);
  console.log(`   OUTLOOK_UPLOAD_EMAIL: ${uploadEmail || 'NOT SET'}`);
  console.log(`   OUTLOOK_POLL_INTERVAL: ${pollInterval || 'NOT SET (default: 600000)'}`);
  console.log(`   NODE_ENV: ${nodeEnv || 'NOT SET'}`);

  const allConfigured = clientId && clientSecret && tenantId && uploadEmail;
  console.log(`\n   ✓ All credentials configured: ${allConfigured ? 'YES' : 'NO'}`);

  if (!allConfigured) {
    console.log('\n❌ ERROR: Missing required environment variables!');
    console.log('   Please check your .env file.');
    return;
  }

  // Test email service connection
  console.log('\n2. Testing Email Service Connection:');
  try {
    const emails = await emailService.getUnreadEmails();
    console.log(`   ✓ Successfully connected to email service`);
    console.log(`   ✓ Found ${emails.length} unread email(s)`);

    if (emails.length > 0) {
      console.log('\n   Unread Emails:');
      emails.forEach((email, index) => {
        console.log(`   ${index + 1}. Subject: ${email.subject}`);
        console.log(`      From: ${email.from.emailAddress.address}`);
        console.log(`      Has Attachments: ${email.hasAttachments}`);
        if (email.hasAttachments && email.attachments) {
          console.log(`      Attachments: ${email.attachments.length}`);
          email.attachments.forEach((att, i) => {
            const isExcel = emailService.isExcelAttachment(att);
            console.log(`        ${i + 1}. ${att.name} (${att.size} bytes) - ${isExcel ? 'Excel ✓' : 'Not Excel'}`);
          });
        }
      });
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    if (error.statusCode) {
      console.log(`   Status Code: ${error.statusCode}`);
    }
    console.log('\n   Common issues:');
    console.log('   - Invalid credentials');
    console.log('   - Missing API permissions in Azure');
    console.log('   - Email address not found in Office 365 tenant');
    console.log('   - Network connectivity issues');
    return;
  }

  // Test email processing
  console.log('\n3. Testing Email Processing:');
  try {
    const results = await processAllUnreadEmails();
    console.log(`   ✓ Processed ${results.length} email(s)`);
    
    if (results.length > 0) {
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      console.log(`   ✓ Successful: ${successCount}`);
      if (failureCount > 0) {
        console.log(`   ❌ Failed: ${failureCount}`);
        results.filter(r => !r.success).forEach(r => {
          console.log(`      - ${r.fileName || 'Unknown'}: ${r.error}`);
        });
      }
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  console.log('\n=== Diagnostic Complete ===');
}

checkEmailService().catch(console.error);

