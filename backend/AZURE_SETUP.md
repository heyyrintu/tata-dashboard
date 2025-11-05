# Azure App Registration Setup for Email Upload

## Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: TATA Dashboard Email Service
   - **Supported account types**: Single tenant or Multi-tenant (as needed)
   - **Redirect URI**: Leave blank for now (we'll use client credentials flow)
5. Click **Register**

## Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Add the following permissions:
   - `Mail.Read` - Read mail in all mailboxes
   - `Mail.ReadWrite` - Read and write mail in all mailboxes
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin rights)

## Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "Email Service Secret"
4. Set expiration (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT**: 
   - You will see TWO values: **Secret ID** and **Secret Value**
   - Copy the **Secret Value** (the long string, NOT the Secret ID)
   - You can only see the Secret Value ONCE - copy it immediately!
   - The Secret ID is visible in the portal but is NOT what you need for authentication

## Step 4: Get Application Details

From the **Overview** page, copy:
- **Application (client) ID**
- **Directory (tenant) ID**

## Step 5: Configure Environment Variables

Add to `backend/.env`:
```env
OUTLOOK_CLIENT_ID=<your-client-id>
OUTLOOK_CLIENT_SECRET=<your-client-secret-VALUE>
OUTLOOK_TENANT_ID=<your-tenant-id>
OUTLOOK_UPLOAD_EMAIL=upload@yourdomain.com
OUTLOOK_ARCHIVE_FOLDER=Processed
OUTLOOK_POLL_INTERVAL=600000
```

**Important Notes:**
- `OUTLOOK_CLIENT_SECRET` must be the **Secret Value** (the long string), NOT the Secret ID
- The Secret Value looks like: `abc123~XYZ789...` (a long alphanumeric string)
- If you didn't copy the Secret Value when creating it, you'll need to create a new secret

## Notes

- The email address (`OUTLOOK_UPLOAD_EMAIL`) should be a mailbox in your Office 365 tenant
- The archive folder will be created automatically if it doesn't exist
- Poll interval is in milliseconds (600000 = 10 minutes)

