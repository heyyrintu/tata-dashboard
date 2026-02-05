#!/bin/sh

# Navigate to backend directory
cd /app/backend

# Run Prisma db push to ensure tables exist (creates tables if they don't exist)
echo "[Startup] Running Prisma db push to sync database schema..."
npx prisma db push --skip-generate

# Start the Node.js server
echo "[Startup] Starting Node.js server..."
exec node /app/backend/dist/server.js
