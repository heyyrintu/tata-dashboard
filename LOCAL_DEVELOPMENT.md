# Local Development Setup Guide

## Quick Fix for Network Errors

If you're getting network errors when running locally, follow these steps:

### Backend Setup

1. **Create `.env` file in `backend/` directory** (if it doesn't exist):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/tata-dashboard
   
   # Leave API_KEY empty for local development (allows all requests)
   # API_KEY=
   
   # Leave FRONTEND_URL empty for local development (allows all origins)
   # FRONTEND_URL=
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Frontend Setup

1. **Create `.env` file in `frontend/` directory** (if it doesn't exist):
   ```env
   VITE_API_URL=http://localhost:5000/api
   
   # Leave VITE_API_KEY empty for local development
   # VITE_API_KEY=
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Troubleshooting Network Errors

### Error: "Network Error" or "Failed to fetch"

**Possible Causes:**

1. **Backend not running**
   - Check if backend is running on port 5000
   - Check console for errors

2. **CORS blocking requests**
   - In development, CORS should allow all origins
   - Make sure `NODE_ENV=development` in backend `.env`
   - Check browser console for CORS errors

3. **Authentication blocking requests**
   - If `API_KEY` is set in backend `.env`, you need to set `VITE_API_KEY` in frontend `.env`
   - **OR** remove `API_KEY` from backend `.env` for local development

4. **Port conflicts**
   - Make sure port 5000 is not used by another application
   - Check: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)

5. **MongoDB not running**
   - Start MongoDB: `mongod` or `brew services start mongodb-community` (Mac)
   - Or use MongoDB Atlas connection string

### Quick Test

1. **Test backend health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"OK","message":"Server is running",...}`

2. **Test API endpoint** (without auth in dev):
   ```bash
   curl http://localhost:5000/api/analytics
   ```
   Should return analytics data or error (not network error)

3. **Check browser console**:
   - Open browser DevTools (F12)
   - Check Network tab for failed requests
   - Check Console tab for errors

### Common Solutions

**Solution 1: Remove API_KEY for local development**
- Backend `.env`: Comment out or remove `API_KEY=`
- Frontend `.env`: Comment out or remove `VITE_API_KEY=`
- Restart both servers

**Solution 2: Set matching API keys**
- Generate a key: `openssl rand -base64 32`
- Set in backend `.env`: `API_KEY=your-generated-key`
- Set in frontend `.env`: `VITE_API_KEY=your-generated-key`
- Restart both servers

**Solution 3: Check MongoDB connection**
- Make sure MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- Backend will start even if MongoDB is down, but API calls will fail

**Solution 4: Clear browser cache**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

## Development vs Production

### Development (Local)
- `NODE_ENV=development` → CORS allows all origins
- No `API_KEY` → Authentication allows all requests
- Verbose logging enabled

### Production
- `NODE_ENV=production` → CORS restricted to `FRONTEND_URL`
- `API_KEY` required → All requests need authentication
- Error messages sanitized

## Still Having Issues?

1. Check backend logs for errors
2. Check browser console for detailed error messages
3. Verify both servers are running
4. Test backend directly with curl/Postman
5. Check firewall/antivirus blocking localhost connections

