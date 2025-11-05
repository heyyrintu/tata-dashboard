# Email Service Troubleshooting Guide

If emails are not being processed automatically, follow these steps:

## Quick Diagnostic

Run the diagnostic script to check the email service:

```bash
npm run check-email
```

This will:
- Check if all environment variables are set
- Test connection to Microsoft Graph API
- List unread emails
- Test email processing

## Common Issues and Solutions

### 1. Email Service Not Starting

**Symptoms:**
- No email processing happening
- No logs about email service

**Check:**
```bash
# Check if service is running
curl http://localhost:5000/api/email/status
```

**Solution:**
- Ensure `.env` file has all required variables:
  - `OUTLOOK_CLIENT_ID`
  - `OUTLOOK_CLIENT_SECRET`
  - `OUTLOOK_TENANT_ID`
  - `OUTLOOK_UPLOAD_EMAIL`
- Restart the backend server
- Check server logs for email service startup messages

### 2. Authentication Errors

**Symptoms:**
- Error: "Authentication failed" or "401/403"
- Error: "User not found"

**Solutions:**
- Verify Azure app credentials are correct
- Check that API permissions are granted with admin consent:
  - `Mail.Read`
  - `Mail.ReadWrite`
- Verify the email address exists in your Office 365 tenant
- Check if the client secret has expired (create a new one if needed)

### 3. No Emails Found

**Symptoms:**
- Service is running but no emails processed
- "Found 0 unread emails" in logs

**Check:**
- Verify emails are sent to the correct address (`OUTLOOK_UPLOAD_EMAIL`)
- Ensure emails are **unread** (the service only processes unread emails)
- Check that emails have Excel attachments (.xlsx, .xls)
- Verify emails are in the inbox (not in other folders)

**Solution:**
- Send a test email to the configured address
- Ensure the email is unread
- Include an Excel file attachment

### 4. Polling Interval Too Long

**Symptoms:**
- Emails take too long to process (default is 10 minutes)

**Solution:**
- Reduce `OUTLOOK_POLL_INTERVAL` in `.env` (in milliseconds)
- Example: `OUTLOOK_POLL_INTERVAL=60000` (1 minute)
- Minimum: 60000 (1 minute) to avoid rate limiting

### 5. Manual Processing

**To manually trigger email processing:**

**Option 1: API Endpoint**
```bash
curl -X POST http://localhost:5000/api/email/process
```

**Option 2: Admin Dashboard (if you have one)**
- Navigate to the email admin page
- Click "Process Emails Now"

**Option 3: Direct Script**
```bash
npm run check-email
```

### 6. Email Already Read

**Symptoms:**
- Emails exist but not processed
- Service only processes **unread** emails

**Solution:**
- Mark emails as unread in Outlook
- Or send new emails with attachments

### 7. Wrong Email Address

**Symptoms:**
- Emails sent but not processed
- "User not found" error

**Check:**
- Verify `OUTLOOK_UPLOAD_EMAIL` in `.env` matches the actual email address
- Ensure the email exists in your Office 365 tenant
- Test with: `npm run check-email`

### 8. Rate Limiting

**Symptoms:**
- "Rate limit exceeded" errors
- Service stops processing

**Solution:**
- Increase `OUTLOOK_POLL_INTERVAL` (e.g., 600000 = 10 minutes)
- The service will automatically retry on next poll cycle

## Service Status Endpoints

Check email service status:
```bash
GET http://localhost:5000/api/email/status
```

Start service manually:
```bash
POST http://localhost:5000/api/email/start
```

Stop service:
```bash
POST http://localhost:5000/api/email/stop
```

Process emails now:
```bash
POST http://localhost:5000/api/email/process
```

## Testing Steps

1. **Check Configuration:**
   ```bash
   npm run check-email
   ```

2. **Send Test Email:**
   - Send an email with Excel attachment to `OUTLOOK_UPLOAD_EMAIL`
   - Keep it **unread**

3. **Manually Trigger Processing:**
   ```bash
   curl -X POST http://localhost:5000/api/email/process
   ```

4. **Check Logs:**
   - Look for `[EmailPollingService]` and `[EmailService]` messages
   - Check for any error messages

5. **Verify Database:**
   - Check if data was uploaded to MongoDB
   - Check dashboard for new data

## Production Setup

In production, the email service should run as a separate PM2 process:

```bash
pm2 start ecosystem.config.js
```

This starts both:
- `tata-dashboard-backend` (main server)
- `tata-dashboard-email-service` (email polling service)

Check PM2 status:
```bash
pm2 status
pm2 logs tata-dashboard-email-service
```

## Still Not Working?

1. Check backend logs for detailed error messages
2. Run diagnostic: `npm run check-email`
3. Verify Azure app configuration
4. Test with manual processing endpoint
5. Check email inbox for unread emails with Excel attachments

