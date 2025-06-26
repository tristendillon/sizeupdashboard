
# FROM node:18-alpine AS builder

# RUN npm install -g pnpm@10.11.0

# WORKDIR /app

# COPY convex/ ./convex

# WORKDIR /app/convex
# RUN pnpm install --no-frozen-lockfile
# RUN pnpm run build

# WORKDIR /app
# COPY firstdue-listener/ ./firstdue-listener/

# WORKDIR /app/firstdue-listener

# RUN pnpm install --no-frozen-lockfile
# RUN pnpm add -D tsup@8.5.0

# RUN pnpm run build

# FROM node:18-alpine

# RUN npm install -g pnpm@10.11.0

# WORKDIR /app

# COPY --from=builder /app/convex ./convex

# COPY firstdue-listener/package.json firstdue-listener/pnpm-lock.yaml ./firstdue-listener/

# WORKDIR /app/firstdue-listener

# RUN pnpm install --prod --no-frozen-lockfile

# COPY --from=builder /app/firstdue-listener/dist ./dist

# EXPOSE 8080

# CMD ["pnpm", "start"]

# -------- Stage 1: Install dependencies --------
FROM node:18-alpine AS deps

RUN npm install -g pnpm@10.11.0

WORKDIR /app

# Copy only the files needed to install dependencies (for caching)
COPY pnpm-workspace.yaml ./
COPY convex/package.json ./convex/
COPY firstdue-listener/package.json firstdue-listener/pnpm-lock.yaml ./firstdue-listener/

# Install all dependencies (including devDeps for build)
RUN pnpm install --no-frozen-lockfile


# -------- Stage 2: Build both packages --------
FROM node:18-alpine AS builder

RUN npm install -g pnpm@10.11.0

WORKDIR /app

# Copy full source
COPY . .

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/convex/node_modules ./convex/node_modules
COPY --from=deps /app/firstdue-listener/node_modules ./firstdue-listener/node_modules

# Build convex and firstdue-listener
RUN pnpm --filter convex... run build && \
    pnpm --filter firstdue-listener... run build


# -------- Stage 3: Final runtime image --------
FROM node:18-alpine

RUN npm install -g pnpm@10.11.0

WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/firstdue-listener ./firstdue-listener

WORKDIR /app/firstdue-listener

# Install production deps only
RUN pnpm install --prod --no-frozen-lockfile

EXPOSE 8080

CMD ["pnpm", "start"]
