# ================================
# TATA Dashboard - Combined Dockerfile
# Single-service deployment (Frontend + Backend)
# External PostgreSQL required
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

# Build arguments for environment variables
ARG VITE_API_URL=/api
ARG VITE_APPWRITE_ENDPOINT
ARG VITE_APPWRITE_PROJECT_ID
ARG VITE_APPWRITE_ADMIN_TEAM_ID

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APPWRITE_ENDPOINT=$VITE_APPWRITE_ENDPOINT
ENV VITE_APPWRITE_PROJECT_ID=$VITE_APPWRITE_PROJECT_ID
ENV VITE_APPWRITE_ADMIN_TEAM_ID=$VITE_APPWRITE_ADMIN_TEAM_ID

# Build the application
RUN npm run build

# ================================
# Stage 3: Production
# ================================
FROM node:22-alpine AS production

# Add labels
LABEL maintainer="TATA Dashboard Team"
LABEL description="TATA DEF Dashboard - Combined Frontend & Backend"
LABEL version="1.0.0"

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

# Start supervisor (manages both nginx and node)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
