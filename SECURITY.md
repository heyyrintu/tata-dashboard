# Security Guide

This document outlines the security features implemented in the TATA DEF Dashboard and best practices for production deployment.

## Security Features

### 1. Authentication

The application uses a **two-tier authentication model** for security:

**Security Model:**
- **Frontend Requests**: Requests from trusted frontend origins (configured via `FRONTEND_URL`) are automatically allowed without API key. This is secure because:
  - CORS restricts which origins can make requests
  - The frontend and backend are on the same domain/trusted network
  - No API key is exposed in the browser
- **External/Direct API Access**: Direct API calls (e.g., from scripts, Postman, curl) require an API key

**Setup:**
1. Generate a strong API key:
   ```bash
   openssl rand -base64 32
   ```
2. Set it in your backend `.env` file:
   ```env
   API_KEY=your-generated-api-key-here
   FRONTEND_URL=https://apps.dronalogitech.cloud
   ```

**Usage:**
- **Frontend**: No API key needed! Requests from `FRONTEND_URL` are automatically trusted
- **External API Access**: Include the API key in the `Authorization` header:
  ```
  Authorization: Bearer your-api-key-here
  ```
- Or via query parameter (less secure, not recommended):
  ```
  ?apiKey=your-api-key-here
  ```

**Note:** 
- If `API_KEY` is not set, the application will allow all requests (development mode). This is **NOT recommended** for production.
- The frontend does **NOT** need `VITE_API_KEY` set - it's only needed for external API access

### 2. IP Whitelisting (Optional)

You can restrict API access to specific IP addresses:

```env
ALLOWED_IPS=192.168.1.100,10.0.0.50
```

If set, only requests from these IPs will be allowed.

### 3. CORS Protection

CORS is configured to only allow requests from specified origins in production:

```env
FRONTEND_URL=http://your-domain.com
# Multiple origins (comma-separated):
FRONTEND_URL=http://domain1.com,http://domain2.com
```

In development, all origins are allowed. In production, if `FRONTEND_URL` is not set, CORS will be disabled.

### 4. Rate Limiting

API endpoints are protected by rate limiting:
- **Production**: 100 requests per 15 minutes per IP
- **Development**: 1000 requests per 15 minutes per IP

This prevents abuse and DDoS attacks.

### 5. HTTP Security Headers

Helmet.js is configured to set secure HTTP headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (when using HTTPS)
- And more...

### 6. File Upload Security

- **File Type Validation**: Both extension and MIME type checking
- **File Size Limits**: 50MB maximum
- **Filename Sanitization**: Prevents path traversal attacks
- **Content Validation**: Verifies actual file content, not just extension

### 7. Input Validation

All API endpoints validate input using `express-validator`:
- Date parameters must be valid ISO 8601 format
- Query parameters are sanitized
- File uploads are validated

### 8. Error Handling

- Error messages are sanitized in production (no internal details exposed)
- All errors are logged with request IDs for tracking
- Proper HTTP status codes are returned

### 9. Logging

- Structured logging with Winston
- Log rotation (14 days retention)
- Separate error and combined logs
- Request IDs for tracking

### 10. Database Security

- Connection pooling configured
- Retry logic for connection failures
- Credentials masked in logs
- Graceful degradation if database is unavailable

## Production Security Checklist

Before deploying to production:

- [ ] Generate and set `API_KEY` in `.env`
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Set `NODE_ENV=production`
- [ ] Secure MongoDB with authentication
- [ ] Configure firewall (only ports 22, 80, 443 open)
- [ ] Set up SSL/HTTPS certificate
- [ ] Review and restrict `ALLOWED_IPS` if needed
- [ ] Ensure all environment variables are set
- [ ] Test authentication on all endpoints
- [ ] Verify rate limiting is working
- [ ] Check that error messages don't expose internal details
- [ ] Set up log monitoring
- [ ] Configure MongoDB backups

## Security Best Practices

### API Key Management

1. **Generate Strong Keys**: Use at least 32 characters
   ```bash
   openssl rand -base64 32
   ```

2. **Rotate Regularly**: Change API keys periodically

3. **Don't Commit Keys**: Never commit `.env` files to version control

4. **Use Different Keys**: Use different keys for different environments

### MongoDB Security

1. **Enable Authentication**:
   ```bash
   # Create admin user
   mongosh
   use admin
   db.createUser({
     user: "admin",
     pwd: "strong-password",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
   })
   ```

2. **Update Connection String**:
   ```env
   MONGODB_URI=mongodb://admin:strong-password@localhost:27017/tata-dashboard?authSource=admin
   ```

3. **Bind to Localhost**: Don't expose MongoDB port (27017) publicly

### Network Security

1. **Firewall Configuration**:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Use HTTPS**: Always use SSL/TLS in production

3. **Restrict SSH**: Use key-based authentication, disable password auth

### Monitoring

1. **Monitor Logs**: Regularly check application logs for suspicious activity
   ```bash
   pm2 logs
   tail -f /var/log/pm2/tata-backend-error.log
   ```

2. **Monitor Failed Auth**: Watch for authentication failures
   ```bash
   grep "Authentication failed" /var/log/pm2/tata-backend-error.log
   ```

3. **Monitor Rate Limits**: Check for rate limit violations
   ```bash
   grep "Too many requests" /var/log/pm2/tata-backend-error.log
   ```

## Common Security Issues

### Issue: API Key Not Set

**Symptom**: All requests are allowed without authentication

**Solution**: Set `API_KEY` in `.env` file

### Issue: CORS Errors

**Symptom**: Frontend can't make API requests

**Solution**: Set `FRONTEND_URL` in `.env` to match your frontend domain

### Issue: Rate Limit Errors

**Symptom**: "Too many requests" errors

**Solution**: 
- Increase rate limit in `server.ts` (not recommended)
- Implement request caching on frontend
- Contact administrator for whitelisting

### Issue: File Upload Fails

**Symptom**: File upload rejected

**Solution**:
- Check file size (max 50MB)
- Verify file is valid Excel format (.xlsx, .xls)
- Check file content (not just extension)

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Contact the development team directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## Updates and Patches

- Keep dependencies updated: `npm audit` and `npm update`
- Monitor security advisories for Node.js and MongoDB
- Apply security patches promptly
- Review and update API keys regularly

