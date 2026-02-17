# TATA Dashboard - Comprehensive Optimization & Security Plan

## Audit Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 2 | 4 | 8 | 2 |
| Code Quality | 1 | 3 | 5 | 3 |
| Configuration | 1 | 2 | 4 | 2 |
| Performance | 0 | 1 | 3 | 1 |
| **Total** | **4** | **10** | **20** | **8** |

---

## Phase 1: Critical Security Fixes (Backend)

### 1.1 Apply Authentication Middleware to All Routes
**File:** `backend/src/server.ts` (lines 66-68)
- Auth middleware exists in `backend/src/middleware/auth.ts` but is NEVER imported or used
- All API endpoints (`/api/upload`, `/api/analytics`, `/api/email`) are completely unauthenticated
- **Fix:** Import and apply `authenticate` middleware before route registration

### 1.2 Fix CORS Default Fallback
**File:** `backend/src/server.ts` (line 20)
- `origin: process.env.FRONTEND_URL || '*'` defaults to allow ALL origins
- **Fix:** Default to `http://localhost:5173` (dev) instead of `*`, and throw error in production if `FRONTEND_URL` not set

### 1.3 Add Security Headers (Helmet)
**File:** `backend/src/server.ts`
- No security headers: missing X-Content-Type-Options, X-Frame-Options, CSP, HSTS
- **Fix:** Install and apply `helmet` package

### 1.4 Add Rate Limiting
**File:** `backend/src/server.ts`
- No rate limiting on any endpoint - vulnerable to DoS
- **Fix:** Install `express-rate-limit`, apply global + per-route limits

### 1.5 Stop Logging Credentials
**File:** `backend/src/server.ts` (lines 92-94)
- IMAP user email and host logged to stdout
- **Fix:** Log only "IMAP configured" without credentials

### 1.6 Reduce JSON Body Size Limit
**File:** `backend/src/server.ts` (lines 25-26)
- 50MB limit for JSON body is excessive (file uploads use multer separately)
- **Fix:** Reduce to `10mb` for JSON, `1mb` for urlencoded

### 1.7 Add Environment Variable Validation
**File:** `backend/src/server.ts`
- No validation that required env vars (DATABASE_URL, etc.) are set
- **Fix:** Validate at startup, fail fast if missing in production

### Verification:
- Grep for `authenticate` import in server.ts
- Grep for `helmet` usage
- Grep for `rateLimit` usage
- Test CORS with cross-origin request
- Confirm credentials NOT in logs

---

## Phase 2: Fix Backend Code Quality & Bugs

### 2.1 Fix Email Sender Validation (Security Bug)
**File:** `backend/src/services/emailService.ts` (line 109)
- Uses `senderLower.includes(allowed)` which is too permissive
- Example: `attacker+admin@evil.com` matches if `admin@evil.com` is allowed
- **Fix:** Change to strict equality: `senderLower === allowed`

### 2.2 Fix Upload Race Condition
**File:** `backend/src/controllers/uploadController.ts` (lines 74-77)
- `deleteMany()` then `createMany()` without transaction
- Concurrent uploads can corrupt data
- **Fix:** Wrap in `prisma.$transaction()`

### 2.3 Apply Validation Middleware to Routes
**File:** `backend/src/routes/analytics.ts`
- Validation middleware defined in `validation.ts` but NEVER applied to any route
- **Fix:** Apply `validateAnalyticsQuery` to all analytics routes

### 2.4 Improve File Upload Validation
**File:** `backend/src/routes/upload.ts` (lines 18-32)
- Only validates file extension, not MIME type
- **Fix:** Add MIME type check + sanitize filenames

### 2.5 Fix Unhandled Promise Rejections in Email Polling
**File:** `backend/src/services/emailPollingService.ts` (lines 38-40)
- `setInterval` fires `processEmails()` without `.catch()`
- **Fix:** Add error handling wrapper

### 2.6 Fix Inefficient Database Queries
**File:** `backend/src/controllers/analyticsController.ts`
- Multiple endpoints load ALL rows into memory then filter in JS
- **Fix:** Add proper WHERE clauses to Prisma queries, use `Prisma.TripWhereInput` instead of `any`

### 2.7 Sanitize File Paths in Email Processor
**File:** `backend/src/controllers/uploadController.ts` (line 28)
- `fileName` from email attachment used unsanitized in file path
- **Fix:** Sanitize with regex: `fileName.replace(/[^a-zA-Z0-9._-]/g, '_')`

### 2.8 Disable Excel Formula Evaluation
**File:** `backend/src/utils/excelParser.ts` (line 72)
- `cellFormula: true` enables formula evaluation on uploaded files
- **Fix:** Change to `cellFormula: false`

### Verification:
- Test email sender validation with edge cases
- Test concurrent uploads
- Verify analytics queries use proper WHERE clauses
- Test file upload with malicious filenames

---

## Phase 3: Fix Package.json & Dependencies

### 3.1 Backend: Move Dev Dependencies
**File:** `backend/package.json`
Move from `dependencies` to `devDependencies`:
- `@types/cors`, `@types/express`, `@types/multer`, `@types/node`, `@types/winston`, `@types/xlsx` (lines 32-37)
- `nodemon` (line 44)
- `ts-node` (line 45)
- `typescript` (line 46)

### 3.2 Frontend: Remove Duplicate Animation Library
**File:** `frontend/package.json`
- Both `framer-motion` (line 19) and `motion` (line 21) installed - they are the same library
- Mixed imports across 7 files: some use `"framer-motion"`, others use `"motion/react"`
- **Fix:** Keep `motion` (newer name), remove `framer-motion`, update all imports:
  - `frontend/src/components/AppSidebar.tsx` - change to `motion/react`
  - `frontend/src/components/ui/sidebar.tsx` - change to `motion/react`
  - `frontend/src/pages/AuthPage.tsx` - change to `motion/react`

### 3.3 Frontend: Remove Outdated @types/react-router-dom
**File:** `frontend/package.json` (line 40)
- `@types/react-router-dom v5.3.3` installed but app uses `react-router-dom v7.9.4`
- React Router v6+ ships its own types
- **Fix:** `npm uninstall @types/react-router-dom`

### Verification:
- Run `npm ci` in both frontend and backend
- Run `npm run build` in both
- Grep for `from "framer-motion"` should return 0 results
- Grep for `@types/react-router-dom` should return 0 results in package.json

---

## Phase 4: Fix Frontend Security & Quality

### 4.1 Fix Admin Team Membership Check
**File:** `frontend/src/context/AuthContext.tsx` (line 29)
- Checks if team has ANY members, not if CURRENT user is a member
- **Fix:** Filter membership list for current user's ID

### 4.2 Fix Appwrite Admin Team ID Validation
**File:** `frontend/src/lib/appwrite.ts` (line 23)
- Empty string default for admin team ID silently breaks admin checks
- **Fix:** Throw error if not configured (like endpoint and project ID)

### 4.3 Add Error Boundary
**File:** `frontend/src/App.tsx`
- No React Error Boundary - any component error crashes entire app
- **Fix:** Create ErrorBoundary component, wrap routes

### 4.4 Remove Hardcoded External URLs
**Files:** `frontend/src/pages/AuthPage.tsx` (line 7), `frontend/src/components/Header.tsx` (line 65)
- Hardcoded Dribbble CDN URL for logo
- **Fix:** Move to .env variable or local asset

### 4.5 Add Axios Timeouts
**File:** `frontend/src/utils/geocoding.ts` and `frontend/src/services/api.ts`
- No timeout on HTTP requests - can hang indefinitely
- **Fix:** Add `timeout: 10000` (10 seconds) to axios config

### 4.6 Fix Geocoding Query Injection
**File:** `frontend/src/utils/geocoding.ts` (line 40)
- Location name not encoded before API call
- **Fix:** Use `encodeURIComponent()` for query parameter

### 4.7 Remove ESLint Disable Comments
**File:** `frontend/src/pages/MainDashboard.tsx` (line 60)
- `eslint-disable-next-line react-hooks/exhaustive-deps` hides potential bug
- **Fix:** Fix the dependency array properly

### Verification:
- Test admin access with non-admin user
- Test error boundary with intentional error
- Verify no hardcoded external URLs remain
- Test geocoding with special characters

---

## Phase 5: Fix Docker & Deployment Configuration

### 5.1 Fix Docker-Compose Database Mismatch (CRITICAL)
**File:** `docker-compose.yml`
- Configures **MongoDB** but backend uses **PostgreSQL** (Prisma)
- Backend depends_on `mongodb` which it doesn't use
- `MONGODB_URI` env var passed but backend needs `DATABASE_URL` (PostgreSQL)
- **Fix:** Replace MongoDB service with PostgreSQL, update env vars

### 5.2 Fix Docker-Compose Dev Database Mismatch
**File:** `docker-compose.dev.yml`
- Same MongoDB/PostgreSQL mismatch as production
- **Fix:** Replace MongoDB with PostgreSQL, update volumes and env vars

### 5.3 Update .env.example
**File:** `.env.example`
- References `MONGO_ROOT_USERNAME`/`MONGO_ROOT_PASSWORD` (lines 9-10)
- Missing IMAP configuration variables
- **Fix:** Update to PostgreSQL vars, add IMAP vars, remove Outlook-only references

### 5.4 Update backend/env.example
**File:** `backend/env.example`
- Contains real Azure AD credentials (client ID, tenant ID)
- **Fix:** Replace with placeholder values

### 5.5 Add Non-Root User to Combined Dockerfile
**File:** `Dockerfile` (root)
- Runs as root in production
- **Fix:** Add non-root user like backend/Dockerfile does

### 5.6 Add Error Handling to Start Script
**File:** `start-backend.sh`
- No `set -e`, no error checking on `prisma db push`
- **Fix:** Add `set -e` and error handling

### 5.7 Add Missing Security Headers to Nginx
**Files:** `frontend/nginx.conf`, `nginx/docker-nginx.conf`
- Missing CSP, HSTS, Permissions-Policy headers
- **Fix:** Add security headers to both configs

### 5.8 Add Database Constraints to Prisma Schema
**File:** `backend/prisma/schema.prisma`
- All fields optional, no unique constraints, minimal indexes
- **Fix:** Add NOT NULL to critical fields, unique constraints, additional indexes

### Verification:
- `docker-compose config` validates without errors
- `docker-compose up` connects backend to PostgreSQL
- Nginx returns security headers
- Prisma migration runs successfully

---

## Phase 6: Code Cleanup

### 6.1 Archive Debug Scripts
**File:** `backend/src/scripts/` (36 files)
- Only 8 have npm shortcuts, 28 are orphaned debug/test scripts
- **Fix:** Move unused scripts to `backend/src/scripts/archive/` or delete

### 6.2 Remove Unused Outlook Email References
- Docker-compose references Outlook vars but app now uses IMAP
- **Fix:** Remove Outlook env vars from docker-compose, keep in env.example as optional

### 6.3 Replace `any` Types in Backend
**File:** `backend/src/controllers/analyticsController.ts`
- Multiple `whereClause: any = {}` instead of `Prisma.TripWhereInput`
- **Fix:** Use proper Prisma types throughout

### 6.4 Extract Magic Numbers to Constants
**File:** `backend/src/controllers/analyticsController.ts`
- Hardcoded rates: `10.5` (barrel conversion), bucket/barrel rates
- **Fix:** Create `backend/src/config/constants.ts` with named constants

### Verification:
- TypeScript compiles without errors
- No `any` types in controller where clauses
- Magic numbers replaced with named constants
- Scripts directory cleaned

---

## Phase 7: Final Verification

### 7.1 Build Check
- `cd backend && npm run build` - must succeed
- `cd frontend && npm run build` - must succeed
- `cd frontend && npm run lint` - must pass

### 7.2 Security Grep Checks
- `grep -r "origin: .*\*" backend/` - should find 0 results
- `grep -r "console.log.*IMAP_USER\|console.log.*PASSWORD" backend/` - should find 0 results
- `grep -r "any" backend/src/controllers/` - should be minimal
- `grep -r "framer-motion" frontend/src/` - should find 0 results
- `grep -r "includes(allowed)" backend/` - should find 0 results

### 7.3 Docker Validation
- `docker-compose config` - validates successfully
- No MongoDB references in docker-compose

### 7.4 Dependency Check
- No `@types/*` in backend `dependencies` section
- No duplicate animation libraries in frontend
- No `@types/react-router-dom` in frontend

---

## Execution Order

| Phase | Priority | Estimated Files Modified | Dependencies |
|-------|----------|------------------------|--------------|
| Phase 1 | CRITICAL | 3-4 backend files | None |
| Phase 2 | HIGH | 5-6 backend files | Phase 1 |
| Phase 3 | HIGH | 2 package.json + 3 import files | None |
| Phase 4 | MEDIUM | 6-8 frontend files | Phase 3 |
| Phase 5 | HIGH | 8-10 config files | None |
| Phase 6 | LOW | 5-6 files | Phases 1-5 |
| Phase 7 | REQUIRED | 0 (verification only) | All phases |
