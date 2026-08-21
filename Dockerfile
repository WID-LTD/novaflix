# Multi-stage Dockerfile for NovaFlix

# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built assets
COPY --from=frontend-builder --chown=nextjs:nodejs /app/client/dist ./public
COPY --from=backend-builder --chown=nextjs:nodejs /app/server/dist ./dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/server/package.json ./
COPY --from=backend-builder --chown=nextjs:nodejs /app/server/package-lock.json ./
COPY --from=backend-builder --chown=nextjs:nodejs /app/server/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/download && chown -R nextjs:nodejs /app/download

USER nextjs

EXPOSE 3030

ENV NODE_ENV=production
ENV PORT=3030

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]