# TATA DEF Dashboard - Production Deployment Guide

This guide provides step-by-step instructions for deploying the TATA DEF Dashboard to a production VPS server.

## Prerequisites

- VPS with Ubuntu 20.04+ (2GB RAM minimum, 4GB recommended)
- Domain name (optional, can use IP address)
- SSH access to server
- Root or sudo access

## Quick Start

1. Follow the phases below in order
2. Replace `your-domain.com` with your actual domain or IP address
3. Replace `your-secure-password` with a strong MongoDB password

## Phase 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js (v18+)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify installation
```

### 1.3 Install MongoDB
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

### 1.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.5 Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Phase 2: Application Deployment

### 2.1 Create Application Directory
```bash
sudo mkdir -p /var/www/tata-dashboard
sudo chown $USER:$USER /var/www/tata-dashboard
cd /var/www/tata-dashboard
```

### 2.2 Clone Repository
```bash
git clone <your-repo-url> .
# OR upload files via SCP/SFTP
```

### 2.3 Backend Setup
```bash
cd backend
npm install --production
npm run build
```

### 2.4 Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

### 2.5 Create Environment Files

**Backend `.env`** (`/var/www/tata-dashboard/backend/.env`):
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tata-dashboard
# For secured MongoDB:
# MONGODB_URI=mongodb://admin:your-secure-password@localhost:27017/tata-dashboard?authSource=admin

# Outlook/Office 365 Email Configuration (Optional - for automatic email upload)
# See backend/AZURE_SETUP.md for Azure app registration instructions
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret-value
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_UPLOAD_EMAIL=upload@yourdomain.com
OUTLOOK_ARCHIVE_FOLDER=Processed
OUTLOOK_POLL_INTERVAL=600000
# Poll interval in milliseconds (600000 = 10 minutes)
```

**Frontend `.env.production`** (`/var/www/tata-dashboard/frontend/.env.production`):
```env
VITE_API_URL=http://your-domain.com/api
# OR if using IP: VITE_API_URL=http://your-server-ip/api
```

## Phase 3: Process Management

### 3.1 Copy PM2 Ecosystem File
```bash
# Copy ecosystem.config.js from project root to /var/www/tata-dashboard/
cp ecosystem.config.js /var/www/tata-dashboard/
```

### 3.2 Start Application with PM2
```bash
cd /var/www/tata-dashboard
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

**Note:** The PM2 ecosystem file starts two processes:
- `tata-dashboard-backend` - Main API server
- `tata-dashboard-email-service` - Email polling service (only runs if email credentials are configured)

Verify both processes are running:
```bash
pm2 status
# Should show both processes with "online" status
```

If email service is not needed, you can remove it from `ecosystem.config.js` or ensure email environment variables are not set.

## Phase 4: Nginx Configuration

### 4.1 Copy Nginx Config
```bash
# Copy nginx configuration
sudo cp nginx/tata-dashboard.conf /etc/nginx/sites-available/tata-dashboard
```

### 4.2 Edit Configuration
```bash
sudo nano /etc/nginx/sites-available/tata-dashboard
# Replace 'your-domain.com' with your actual domain or IP
```

### 4.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/tata-dashboard /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Phase 5: Email Service Setup (Optional)

### 5.1 Azure App Registration

To enable automatic email-based file upload, you need to register an Azure application:

1. Follow the detailed instructions in `backend/AZURE_SETUP.md`
2. Register an application in Azure AD
3. Configure API permissions: `Mail.Read` and `Mail.ReadWrite` (Application permissions)
4. Grant admin consent for the permissions (requires Azure admin account)
5. Create a client secret and copy the **Secret Value** (not Secret ID)
6. Get your Client ID, Tenant ID, and Client Secret

### 5.2 Configure Email Environment Variables

Add the email configuration to your backend `.env` file (see Phase 2.5):

```env
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-secret-value
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_UPLOAD_EMAIL=upload@yourdomain.com
OUTLOOK_ARCHIVE_FOLDER=Processed
OUTLOOK_POLL_INTERVAL=600000
```

**Important:** Use the Secret **Value** (long string), not the Secret ID (GUID format).

### 5.3 Verify Email Service

After starting PM2, check if email service is running:

```bash
pm2 status tata-dashboard-email-service
pm2 logs tata-dashboard-email-service
```

Test email service connection:
```bash
cd /var/www/tata-dashboard/backend
npm run check-email
```

### 5.4 Email Service Features

- Automatically checks for new emails every 10 minutes (configurable via `OUTLOOK_POLL_INTERVAL`)
- Processes Excel attachments (.xlsx, .xls) from unread emails
- Archives processed emails to "Processed" folder
- Manual processing via API: `POST http://your-domain.com/api/email/process`
- Service status endpoint: `GET http://your-domain.com/api/email/status`

**Note:** 
- Email service requires the configured email address to exist in your Office 365 tenant
- Emails must be **unread** to be processed
- Only emails with Excel attachments are processed

## Phase 6: SSL/HTTPS Setup (Optional but Recommended)

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
# Follow prompts to configure SSL
```

## Phase 7: Security & Firewall

### 7.1 Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 7.2 Secure MongoDB

Edit `/etc/mongod.conf`:
```bash
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

Create MongoDB admin user:
```bash
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
exit
```

Update backend `.env`:
```env
MONGODB_URI=mongodb://admin:your-secure-password@localhost:27017/tata-dashboard?authSource=admin
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

## Phase 8: File Permissions & Directories

### 8.1 Set Proper Permissions
```bash
sudo chown -R $USER:$USER /var/www/tata-dashboard
sudo chmod -R 755 /var/www/tata-dashboard
sudo chmod -R 755 /var/www/tata-dashboard/backend/uploads
```

### 8.2 Create Log Directory
```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

## Phase 9: Backup Strategy

### 9.1 Copy Backup Script
```bash
# Copy backup script to server
cp scripts/backup-mongodb.sh /var/www/tata-dashboard/scripts/
chmod +x /var/www/tata-dashboard/scripts/backup-mongodb.sh
```

### 9.2 Setup Cron Job
```bash
crontab -e
# Add: 0 2 * * * /var/www/tata-dashboard/scripts/backup-mongodb.sh
```

## Phase 10: Monitoring & Logs

### 10.1 PM2 Monitoring
```bash
pm2 monit  # Real-time monitoring
pm2 logs   # View logs
pm2 status # Check status
```

### 10.2 Log Rotation
```bash
# Copy logrotate config
sudo cp logrotate/pm2 /etc/logrotate.d/pm2
```

## Maintenance Commands

### Application Management

```bash
# Restart backend application
pm2 restart tata-dashboard-backend

# Restart email service
pm2 restart tata-dashboard-email-service

# Restart all applications
pm2 restart all

# View logs
pm2 logs tata-dashboard-backend
pm2 logs tata-dashboard-email-service
pm2 logs  # View all logs

# Check status
pm2 status
```

### Update Application

```bash
cd /var/www/tata-dashboard
git pull  # or upload new files

# Rebuild backend
cd backend
npm install --production
npm run build

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart services
pm2 restart all
sudo systemctl reload nginx
```

### Email Service Management

```bash
# Check email service status
curl http://localhost:5000/api/email/status

# Manually trigger email processing
curl -X POST http://localhost:5000/api/email/process

# Start/stop email service
pm2 start tata-dashboard-email-service
pm2 stop tata-dashboard-email-service

# Test email service
cd /var/www/tata-dashboard/backend
npm run check-email
```

### MongoDB Operations

```bash
sudo systemctl status mongod
sudo systemctl restart mongod
mongosh  # MongoDB shell
```

## Troubleshooting

### General Issues

- **Backend not starting**: Check PM2 logs `pm2 logs tata-dashboard-backend`
- **MongoDB connection issues**: Verify MongoDB is running `sudo systemctl status mongod`
- **Nginx 502 error**: Check backend is running on port 5000
- **File upload fails**: Verify uploads directory permissions and Nginx `client_max_body_size`

### Email Service Issues

- **Email service not starting**: 
  ```bash
  pm2 logs tata-dashboard-email-service
  # Check if email environment variables are set correctly in .env
  ```

- **403 Authentication errors**: 
  - Verify Azure app permissions are granted with admin consent
  - Ensure permissions are "Application" type, not "Delegated"
  - Check `backend/AZURE_SETUP.md` for detailed setup instructions
  - Wait 5-10 minutes after granting permissions for propagation

- **No emails processed**:
  ```bash
  # Test email service manually
  cd /var/www/tata-dashboard/backend
  npm run check-email
  
  # Check service status via API
  curl http://localhost:5000/api/email/status
  
  # Manually trigger processing
  curl -X POST http://localhost:5000/api/email/process
  ```

- **Emails not found**:
  - Verify emails are sent to the correct address (`OUTLOOK_UPLOAD_EMAIL`)
  - Ensure emails are **unread** (service only processes unread emails)
  - Check emails have Excel attachments (.xlsx, .xls)
  - Verify email address exists in your Office 365 tenant

- **Rate limiting**: Increase `OUTLOOK_POLL_INTERVAL` in `.env` (minimum 60000 = 1 minute)

For more detailed email troubleshooting, see `backend/EMAIL_TROUBLESHOOTING.md`

## Estimated Costs

- VPS (DigitalOcean/Linode): $5-10/month (1GB RAM) or $12-20/month (2GB RAM)
- Domain: $10-15/year (optional)
- Total: ~$5-20/month for basic setup

