# Build stage
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm@10.11.0

# Set working directory
WORKDIR /app

# Copy package files
COPY firstdue-listener/package.json firstdue-listener/pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --no-frozen-lockfile
RUN pnpm add -D tsup@8.5.0

# Copy source code
COPY firstdue-listener/ .

# Copy convex directory
COPY convex/ ./convex

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm@10.11.0

# Set working directory
WORKDIR /app

# Copy package files
COPY firstdue-listener/package.json firstdue-listener/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy convex directory for runtime dependencies
COPY --from=builder /app/convex ./convex

EXPOSE 8080

# Start the application
CMD ["pnpm", "start"]