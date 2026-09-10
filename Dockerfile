# ================================
# NPL DEF Dashboard - Combined Dockerfile
# Single-service deployment (Frontend + Backend) on port 80.
# This is the ONLY supported deployment topology - Coolify builds this file,
# injects env from its UI, terminates TLS and reverse-proxies to port 80.
# External PostgreSQL required.
# ================================

# ================================
# Stage 1: Build Backend
# ================================
FROM node:22-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (ignore postinstall script - prisma schema not available yet)
RUN npm ci --ignore-scripts

# Copy backend source code (including Prisma schema)
COPY backend/ .

# Generate Prisma client and build TypeScript
RUN npx prisma generate && npm run build

# ================================
# Stage 2: Build Frontend
# ================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ .

# NOTE: no VITE_* build arguments.
#
# All frontend configuration (VITE_API_URL, the Appwrite variables, VITE_LOGO_URL,
# VITE_API_KEY) is resolved at RUNTIME from /env.js, which docker-entrypoint.sh
# writes from the container environment before nginx starts. Set those as
# ordinary runtime variables in Coolify - the image is config-independent, so a
# config change is a restart rather than a rebuild.
# See frontend/src/lib/runtimeEnv.ts and DEPLOYMENT.md.

# Build the application
RUN npm run build

# ================================
# Stage 3: Production
# ================================
FROM node:22-alpine AS production

# Add labels
LABEL maintainer="NPL DEF Dashboard Team"
LABEL description="NPL DEF Dashboard - Combined Frontend & Backend"
LABEL version="2.0.0"

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy backend package files and Prisma schema
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

# Install production dependencies (ignore postinstall - we run prisma generate explicitly)
RUN cd backend && npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Generate Prisma client in production
RUN cd backend && npx prisma generate

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Create backend directories
RUN mkdir -p backend/uploads backend/logs

# Copy built frontend to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration (replace main config for Alpine)
COPY nginx.combined.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Copy and make startup scripts executable
COPY start-backend.sh /app/start-backend.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/start-backend.sh /app/docker-entrypoint.sh

# Create necessary directories and set permissions
RUN mkdir -p /var/log/supervisor /run/nginx /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx /run/nginx /usr/share/nginx/html

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check (increased start period for service initialization)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# The entrypoint writes /env.js from the runtime environment, then execs
# supervisord as PID 1 so Coolify's SIGTERM reaches nginx and node.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
