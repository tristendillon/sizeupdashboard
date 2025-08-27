FROM node:18-alpine AS builder

RUN npm install -g pnpm@10.11.0 turbo@latest

WORKDIR /app

# Step 1: copy lockfiles and workspace config (cache these layers well)
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json package.json ./

# Step 2: copy package.json of your packages to install deps
COPY convex/package.json ./convex/
COPY firstdue-listener/package.json ./firstdue-listener/

# Step 3: install all dependencies (including dev deps for build tools)
RUN pnpm install --frozen-lockfile

# Step 4: copy source files only (cache bust only on source changes)
COPY convex ./convex
COPY firstdue-listener ./firstdue-listener

# Step 5: run turbo build for your filtered packages
RUN turbo run build --filter=@sizeupdashboard/firstdue-listener --cache-dir=.turbo


# Final stage: only production dependencies and dist files
FROM node:18-alpine

RUN npm install -g pnpm@10.11.0

WORKDIR /app

COPY --from=builder /app/convex ./convex
COPY --from=builder /app/firstdue-listener ./firstdue-listener

COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json

RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/firstdue-listener

EXPOSE 8080

CMD ["pnpm", "start"]
