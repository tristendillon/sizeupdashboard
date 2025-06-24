# Build stage
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm@10.11.0

# Set working directory
WORKDIR /app

# Copy convex package first
COPY convex/ ./convex

# Build convex package
WORKDIR /app/convex
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build

# Go back to app directory and copy firstdue-listener files
WORKDIR /app
COPY firstdue-listener/ ./firstdue-listener/

# Change to firstdue-listener directory
WORKDIR /app/firstdue-listener

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --no-frozen-lockfile
RUN pnpm add -D tsup@8.5.0

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm@10.11.0

# Set working directory
WORKDIR /app

# Copy built convex package from builder stage
COPY --from=builder /app/convex ./convex

# Copy package files to a firstdue-listener directory
COPY firstdue-listener/package.json firstdue-listener/pnpm-lock.yaml ./firstdue-listener/

# Change to firstdue-listener directory
WORKDIR /app/firstdue-listener

# Install only production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/firstdue-listener/dist ./dist

EXPOSE 8080

# Start the application
CMD ["pnpm", "start"]