# Appwrite Authentication Setup Guide

This guide explains how to configure Appwrite authentication for the TATA DEF Dashboard.

## Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=692d27c4001cdb8b680b
VITE_APPWRITE_ADMIN_TEAM_ID=692d2f3d002fa6a6e228
```

### Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Your backend API endpoint | Yes |
| `VITE_APPWRITE_ENDPOINT` | Appwrite server endpoint (e.g., `https://fra.cloud.appwrite.io/v1`) | Yes |
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID | Yes |
| `VITE_APPWRITE_ADMIN_TEAM_ID` | Team ID for admin users | Yes |

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

---

## Appwrite Console Setup

### 1. Create a Project (if not exists)

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Click **Create Project**
3. Name it (e.g., `tatadef`)
4. Copy the **Project ID** → use as `VITE_APPWRITE_PROJECT_ID`

### 2. Enable Email/Password Authentication

1. Go to **Auth** → **Settings**
2. Under **Auth methods**, enable **Email/Password**

### 3. Create Admin Team

1. Go to **Auth** → **Teams**
2. Click **Create Team**
3. Name: `admin` (or any name)
4. Copy the **Team ID** → use as `VITE_APPWRITE_ADMIN_TEAM_ID`

### 4. Add Admin Users to Team

1. Open the admin team
2. Click **Members** → **Invite Member**
3. Enter user email
4. Select roles: `admin` (or leave default)
5. User receives email invite and must accept

---

## Access Control

### Route Protection

| Route | Access Level |
|-------|--------------|
| `/auth` | Public |
| `/` | Authenticated users |
| `/upload` | Admin only |
| `/powerbi` | Admin only |

### How It Works

1. **ProtectedRoute** - Checks if user is logged in, redirects to `/auth` if not
2. **AdminRoute** - Checks if user is in admin team, shows "Access Denied" if not
3. **Sidebar** - Hides admin-only links for non-admin users

---

## Production Deployment

### 1. Set Environment Variables

For production, set these in your hosting platform:

**Netlify:**
```
Site Settings → Environment Variables → Add variables
```

**Vercel:**
```
Project Settings → Environment Variables → Add
```

**Docker:**
```dockerfile
ENV VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
ENV VITE_APPWRITE_PROJECT_ID=your_project_id
ENV VITE_APPWRITE_ADMIN_TEAM_ID=your_team_id
```

### 2. Add Platform to Appwrite

1. Go to Appwrite Console → **Overview** → **Platforms**
2. Click **Add Platform** → **Web App**
3. Add your production domain (e.g., `https://yourdomain.com`)

> **Important:** Without adding your domain as a platform, Appwrite will block requests with CORS errors.

### 3. Build for Production

```bash
cd frontend
npm run build
```

The build will use environment variables from `.env` or your hosting platform.

---

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use HTTPS in production** - Required for secure cookies
3. **Validate on backend** - Don't rely solely on frontend checks
4. **Rotate credentials** - If compromised, regenerate project/team IDs

---

## Troubleshooting

### "Missing Appwrite configuration" Error

Ensure all required env variables are set:
```bash
# Check .env file exists
cat frontend/.env

# Restart dev server after changes
npm run dev
```

### CORS Errors

Add your domain to Appwrite platforms:
1. Appwrite Console → Overview → Platforms
2. Add `http://localhost:5173` for development
3. Add `https://yourdomain.com` for production

### "Access Denied" for Admin User

1. Verify user accepted team invite (check email)
2. Check team ID matches `VITE_APPWRITE_ADMIN_TEAM_ID`
3. Clear browser cache and re-login

### User Not Redirecting After Login

Check browser console for errors. Common issues:
- Session cookie blocked (use HTTPS)
- Appwrite endpoint unreachable

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/appwrite.ts` | Appwrite client configuration |
| `src/context/AuthContext.tsx` | Authentication state & hooks |
| `src/components/ProtectedRoute.tsx` | Auth-required route wrapper |
| `src/components/AdminRoute.tsx` | Admin-only route wrapper |
| `src/pages/AuthPage.tsx` | Login/Signup page |

---

## Quick Start

```bash
# 1. Copy example env file
cp env.production.example .env

# 2. Edit .env with your values
# VITE_APPWRITE_PROJECT_ID=your_project_id
# VITE_APPWRITE_ADMIN_TEAM_ID=your_team_id

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Open http://localhost:5173/auth to login
```
