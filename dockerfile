# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Base Stage
# -----------------------------------------------------------------------------
FROM node:22.14.0-alpine AS base

# Install compatibility libraries for Alpine
# libc6-compat is often needed for pre-built binaries (like esbuild/sharp)
RUN apk add --no-cache libc6-compat tini

# Set working directory
WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies Stage (Dev + Prod)
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package management files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for building)
# uses npm ci for deterministic installation
RUN npm ci

# -----------------------------------------------------------------------------
# Production Dependencies Stage
# -----------------------------------------------------------------------------
FROM base AS prod-deps

COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM base AS build

# Define build arguments (can be passed via --build-arg)
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY

# Persist ARGs as ENV for the build process if needed by Astro
ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Run the build
RUN npm run build

# -----------------------------------------------------------------------------
# Runner Stage
# -----------------------------------------------------------------------------
FROM base AS runner

# Label metadata
LABEL maintainer="Gutsy Team"
LABEL version="0.0.1"

# Set production environment
ENV NODE_ENV=production

# Network Configuration (Override Astro default 3000 -> 8080)
ENV HOST=0.0.0.0
ENV PORT=8080

# Create a non-root user (node user comes with the image)
# We ensure permissions are correct for the app directory
RUN chown node:node /app

# Switch to non-root user
USER node

# Copy production dependencies
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# Copy build artifacts
COPY --from=build --chown=node:node /app/dist ./dist
# Copy package.json (optional, useful for debugging or specific scripts)
COPY --from=build --chown=node:node /app/package.json ./package.json

# Expose the application port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start the application
# Using tini (-- init) to handle signals correctly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./dist/server/entry.mjs"]
