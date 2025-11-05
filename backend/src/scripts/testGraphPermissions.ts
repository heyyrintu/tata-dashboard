import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

async function testGraphPermissions() {
  console.log('=== Testing Microsoft Graph API Permissions ===\n');

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenantId = process.env.OUTLOOK_TENANT_ID;
  const uploadEmail = process.env.OUTLOOK_UPLOAD_EMAIL;

  if (!clientId || !clientSecret || !tenantId || !uploadEmail) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    // Initialize credential
    console.log('1. Initializing Azure credentials...');
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    // Create auth provider
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    // Initialize Graph client
    const client = Client.initWithMiddleware({
      authProvider: authProvider
    });

    console.log('   ✓ Credentials initialized');

    // Test 1: Get user info
    console.log('\n2. Testing: Get user information...');
    try {
      const user = await client.api(`/users/${uploadEmail}`).get();
      console.log(`   ✓ User found: ${user.displayName || user.mail || uploadEmail}`);
      console.log(`   ✓ User ID: ${user.id}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get user: ${error.message}`);
      if (error.statusCode) {
        console.log(`   Status Code: ${error.statusCode}`);
      }
      if (error.body) {
        console.log(`   Response: ${JSON.stringify(error.body, null, 2)}`);
      }
    }

    // Test 2: List mail folders
    console.log('\n3. Testing: List mail folders...');
    try {
      const folders = await client.api(`/users/${uploadEmail}/mailFolders`).get();
      console.log(`   ✓ Found ${folders.value?.length || 0} mail folders`);
      if (folders.value && folders.value.length > 0) {
        console.log('   Folders:');
        folders.value.slice(0, 5).forEach((folder: any) => {
          console.log(`     - ${folder.displayName} (${folder.totalItemCount || 0} items)`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Failed to list folders: ${error.message}`);
      if (error.statusCode) {
        console.log(`   Status Code: ${error.statusCode}`);
      }
      if (error.body) {
        console.log(`   Response: ${JSON.stringify(error.body, null, 2)}`);
      }
    }

    // Test 3: Get messages (with detailed error)
    console.log('\n4. Testing: Get messages (read permission)...');
    try {
      const response = await client
        .api(`/users/${uploadEmail}/messages`)
        .top(1)
        .get();
      console.log(`   ✓ Successfully read messages`);
      console.log(`   ✓ Found ${response.value?.length || 0} message(s)`);
    } catch (error: any) {
      console.log(`   ❌ Failed to read messages: ${error.message}`);
      if (error.statusCode) {
        console.log(`   Status Code: ${error.statusCode}`);
      }
      if (error.body) {
        console.log(`   Error Code: ${error.body.error?.code || 'N/A'}`);
        console.log(`   Error Message: ${error.body.error?.message || 'N/A'}`);
        console.log(`   Full Response: ${JSON.stringify(error.body, null, 2)}`);
      }
      console.log('\n   Possible issues:');
      console.log('   - Admin consent not properly granted');
      console.log('   - Permissions are "Delegated" instead of "Application"');
      console.log('   - Permissions need time to propagate (wait 5-10 minutes)');
      console.log('   - Client secret expired or incorrect');
    }

    // Test 4: Check token scopes
    console.log('\n5. Testing: Get access token scopes...');
    try {
      const token = await credential.getToken(['https://graph.microsoft.com/.default']);
      console.log(`   ✓ Token obtained`);
      console.log(`   Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
      // Note: Token details don't show scopes in the response
    } catch (error: any) {
      console.log(`   ❌ Failed to get token: ${error.message}`);
    }

  } catch (error: any) {
    console.log(`\n❌ Fatal Error: ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
  }

  console.log('\n=== Test Complete ===');
  console.log('\nNext steps:');
  console.log('1. Verify in Azure Portal: API permissions show "Granted for [Your Organization]"');
  console.log('2. Ensure permissions are "Application" type, not "Delegated"');
  console.log('3. Wait 5-10 minutes after granting consent for propagation');
  console.log('4. Verify client secret is not expired');
}

testGraphPermissions().catch(console.error);

