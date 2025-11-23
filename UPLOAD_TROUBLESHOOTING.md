# Upload Network Error - Troubleshooting Guide

## Common Causes and Solutions

### 1. Backend Server Not Running
**Symptom:** Network Error when trying to upload

**Solution:**
```bash
cd backend
npm run dev
# or
npm start
```

**Check if server is running:**
- Open browser console and check the API URL
- Default: `http://localhost:5000/api`
- Try accessing: `http://localhost:5000/health` in browser

### 2. Wrong API URL
**Symptom:** Network Error, cannot connect

**Check:**
- Open browser DevTools → Console
- Look for: `[API] Uploading file:` log
- Verify the `apiUrl` shown matches your backend

**Fix:**
- Create `.env` file in `frontend/` directory:
  ```
  VITE_API_URL=http://localhost:5000/api
  ```
- Restart frontend dev server

### 3. CORS Issues
**Symptom:** Network Error in browser console with CORS message

**Solution:**
- Check `backend/src/server.ts` - CORS should allow your frontend URL
- Default allows all origins (`*`) in development
- In production, set `FRONTEND_URL` in backend `.env`

### 4. File Size Too Large
**Symptom:** Timeout error or connection reset

**Current Limits:**
- Backend: 10MB file size limit (in `backend/src/routes/upload.ts`)
- Frontend: 60 second timeout (now increased to 120 seconds)

**Solution:**
- Check file size before uploading
- If file is large, increase timeout in backend

### 5. Port Already in Use
**Symptom:** Server won't start, port 5000 in use

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
# Kill the process using the PID shown

# Or change port in backend/.env
PORT=5001
```

### 6. Firewall/Antivirus Blocking
**Symptom:** Network Error, but server is running

**Solution:**
- Check Windows Firewall settings
- Temporarily disable antivirus to test
- Allow Node.js through firewall

## Debugging Steps

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for `[API]` logs
   - Check for error messages

2. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try uploading file
   - Look for the `/upload` request
   - Check status code and response

3. **Check Backend Logs:**
   - Look at terminal where backend is running
   - Check for error messages
   - Verify route is registered

4. **Test Backend Directly:**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/health
   
   # Test upload endpoint (if you have a test file)
   curl -X POST -F "file=@test.xlsx" http://localhost:5000/api/upload
   ```

## Improved Error Messages

The upload function now provides specific error messages:

- **Network Error:** "Cannot connect to server at {URL}. Please make sure the backend server is running on port 5000."
- **Timeout:** "Upload timeout. The file might be too large. Please try again."
- **No Response:** "No response from server. Please check if the backend is running at {URL}"
- **Server Error:** Shows the actual error message from the server

## Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Backend is accessible at `http://localhost:5000`
- [ ] Health endpoint works: `http://localhost:5000/health`
- [ ] Frontend API URL is correct (check console logs)
- [ ] File size is under 10MB
- [ ] File is valid Excel format (.xlsx or .xls)
- [ ] No firewall blocking the connection
- [ ] Check browser console for specific error messages

## Still Having Issues?

1. Check the browser console for the exact error message
2. Check backend terminal for any error logs
3. Verify both frontend and backend are running
4. Try restarting both servers
5. Clear browser cache and try again

