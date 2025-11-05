# Email-Based Automatic File Upload

This feature enables automatic Excel file upload via email. Emails sent to a configured address will be automatically processed, and Excel attachments will be uploaded to the system.

## Features

- Automatic email monitoring (polls every 10 minutes by default)
- Excel file attachment extraction and processing
- Automatic email archiving after successful processing
- Manual processing via admin API endpoints
- Comprehensive error handling and logging
- Rate limiting protection

## Setup Instructions

### 1. Azure App Registration

Follow the instructions in `AZURE_SETUP.md` to:
- Register an application in Azure AD
- Configure API permissions (`Mail.Read`, `Mail.ReadWrite`)
- Create a client secret
- Get your Client ID, Tenant ID, and Client Secret

### 2. Environment Configuration

Add the following to your `backend/.env` file:

```env
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_UPLOAD_EMAIL=upload@yourdomain.com
OUTLOOK_ARCHIVE_FOLDER=Processed
OUTLOOK_POLL_INTERVAL=600000
```

- `OUTLOOK_UPLOAD_EMAIL`: The email address where Excel files should be sent
- `OUTLOOK_ARCHIVE_FOLDER`: Folder name where processed emails will be archived (default: "Processed")
- `OUTLOOK_POLL_INTERVAL`: Polling interval in milliseconds (default: 600000 = 10 minutes)

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Build and Start

**Development Mode:**
```bash
npm run dev
```
The email service will start automatically if credentials are configured.

**Production Mode:**
```bash
npm run build
pm2 start ecosystem.config.js
```

The email service runs as a separate PM2 process (`tata-dashboard-email-service`).

## Usage

### Automatic Processing

1. Send an email with an Excel file (.xlsx, .xls) attachment to the configured `OUTLOOK_UPLOAD_EMAIL` address
2. The system will automatically:
   - Check for new emails every 10 minutes (or configured interval)
   - Extract Excel attachments
   - Process and upload the data
   - Archive the email after successful processing

### Manual Processing

Use the admin API endpoints to manually trigger email processing:

#### Process Emails Now
```bash
POST /api/email/process
```

#### Get Email Service Status
```bash
GET /api/email/status
```

Response:
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "pollInterval": 600,
    "pollIntervalFormatted": "10 minutes",
    "configured": true
  }
}
```

#### Start Email Service
```bash
POST /api/email/start
```

#### Stop Email Service
```bash
POST /api/email/stop
```

## How It Works

1. **Email Polling Service** (`emailPollingService.ts`)
   - Runs as a background service
   - Polls for new emails at configured intervals
   - Calls the email processor to handle emails

2. **Email Service** (`emailService.ts`)
   - Connects to Microsoft Graph API
   - Retrieves unread emails
   - Downloads attachments
   - Archives emails after processing

3. **Email Processor** (`emailProcessor.ts`)
   - Extracts Excel attachments from emails
   - Validates file format
   - Calls the upload controller to process files
   - Archives emails on success

4. **Upload Controller** (`uploadController.ts`)
   - Processes Excel files (from HTTP upload or email)
   - Validates data
   - Saves to database

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── emailService.ts          # Microsoft Graph API client
│   │   └── emailPollingService.ts   # Background polling service
│   ├── controllers/
│   │   ├── uploadController.ts      # File processing (supports email)
│   │   └── emailController.ts       # Admin API endpoints
│   ├── routes/
│   │   └── email.ts                 # Email API routes
│   └── utils/
│       └── emailProcessor.ts       # Email processing logic
├── AZURE_SETUP.md                   # Azure configuration guide
└── EMAIL_UPLOAD_README.md          # This file
```

## Error Handling

The system includes comprehensive error handling:

- **Authentication Errors**: Clear messages about missing or invalid credentials
- **Rate Limiting**: Automatic retry logic for Microsoft Graph API rate limits
- **File Validation**: Checks for Excel format, file size (max 50MB), and data validity
- **Email Archiving**: Non-blocking - failures are logged but don't stop processing
- **Logging**: All operations are logged for debugging and monitoring

## Monitoring

Check PM2 logs for email service:

```bash
# View logs
pm2 logs tata-dashboard-email-service

# Monitor status
pm2 status

# View specific log file
tail -f /var/log/pm2/tata-email-out.log
tail -f /var/log/pm2/tata-email-error.log
```

## Troubleshooting

### Email service not starting
- Check that all environment variables are set correctly
- Verify Azure app credentials are valid
- Ensure API permissions are granted and admin consent is provided
- Check PM2 logs for specific error messages

### Emails not being processed
- Verify the email address exists in your Office 365 tenant
- Check that emails are being sent to the correct address
- Ensure emails have Excel attachments (.xlsx, .xls)
- Check logs for processing errors

### Rate limiting issues
- Increase `OUTLOOK_POLL_INTERVAL` to poll less frequently
- The system automatically handles rate limits and retries

### Authentication errors
- Verify Azure app registration is correct
- Check that API permissions are granted with admin consent
- Ensure client secret hasn't expired
- Verify tenant ID is correct

## Security Notes

- All credentials are stored in environment variables (never in code)
- OAuth 2.0 client credentials flow for secure authentication
- Rate limiting protection to avoid API quota exhaustion
- File size validation to prevent resource exhaustion
- Email archiving keeps inbox clean and maintains audit trail

## Support

For issues or questions:
1. Check PM2 logs for error messages
2. Verify Azure app configuration
3. Test email processing manually using `/api/email/process` endpoint
4. Review error handling logs in the console

