FROM node:18-alpine AS builder

RUN npm install -g pnpm@10.11.0 turbo@latest

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json package.json ./
COPY convex/package.json ./convex/
COPY firstdue-listener/package.json ./firstdue-listener/
COPY . .

# Install ALL dependencies (including devDependencies)
RUN pnpm install --no-frozen-lockfile

# Run turbo build for just the filtered packages
RUN turbo run build --filter=@sizeupdashboard/convex --filter=@sizeupdashboard/firstdue-listener --cache-dir=.turbo

# Final stage: only production dependencies and dist files
FROM node:18-alpine

RUN npm install -g pnpm@10.11.0

WORKDIR /app

COPY --from=builder /app/convex ./convex
COPY --from=builder /app/firstdue-listener ./firstdue-listener

WORKDIR /app/firstdue-listener

RUN pnpm install --prod --no-frozen-lockfile

EXPOSE 8080

CMD ["pnpm", "start"]
