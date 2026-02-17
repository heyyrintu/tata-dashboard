#!/bin/sh
set -e

# Navigate to backend directory
cd /app/backend

# Run Prisma db push to ensure tables exist
echo "[Startup] Running Prisma db push to sync database schema..."
npx prisma db push --skip-generate || {
    echo "[Startup] ERROR: Failed to sync database schema"
    exit 1
}

# Start the Node.js server
echo "[Startup] Starting Node.js server..."
exec node /app/backend/dist/server.js
