## Base stage with pnpm installed
#FROM node:20-alpine AS base
#ENV PNPM_HOME="/pnpm"
#ENV PATH="$PNPM_HOME:$PATH"
#
## Install pnpm explicitly, skip corepack network calls
#RUN npm install -g pnpm@9
#
## Stage 1: Dependencies
#FROM base AS deps
#WORKDIR /app
#
## Copy package files
#COPY package.json pnpm-lock.yaml* ./
#
## Install dependencies with cache
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
#    pnpm install --frozen-lockfile --prod=false
#
## Stage 2: Builder
#FROM base AS builder
#WORKDIR /app
#
#COPY --from=deps /app/node_modules ./node_modules
#COPY . .
#
#ENV NEXT_TELEMETRY_DISABLED=1
#ENV NODE_ENV=production
#
#RUN pnpm run build
#
## Stage 3: Runner
#FROM node:20-alpine AS runner
#WORKDIR /app
#
#ENV NODE_ENV=production
#ENV NEXT_TELEMETRY_DISABLED=1
#
## Non-root user
#RUN addgroup --system --gid 1001 nodejs && \
#    adduser --system --uid 1001 nextjs
#
#COPY --from=builder /app/public ./public
#RUN mkdir -p .next && chown nextjs:nodejs .next
#
#COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
#COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
#
#USER nextjs
#EXPOSE 3000
#
#ENV PORT=3000
#ENV HOSTNAME="0.0.0.0"
#
#CMD ["node", "server.js"]



# Use BuildKit features (cache mounts) to speed up installs and Next builds.
# Build with BuildKit enabled:
#   DOCKER_BUILDKIT=1 docker build -t my-next-app .
# or with Buildx in CI (recommended) to persist cache across runs.

# Base image with pnpm installed (install version configurable at build time)
FROM node:20-alpine AS base
ARG PNPM_VERSION=9
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_STORE_PATH="/pnpm/store"

# Install pnpm explicitly and keep the image small
RUN npm install -g pnpm@"${PNPM_VERSION}" --no-audit --no-fund

# -----------------------
# Stage: dependencies
# -----------------------
FROM base AS deps
WORKDIR /app

# Copy only manifest files to leverage Docker layer cache for dependencies
COPY package.json pnpm-lock.yaml* ./

# Use BuildKit cache mounts for the pnpm store so repeated builds are much faster.
# pnpm's store dir is set to /pnpm/store (PNPM_STORE_PATH).
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store --reporter=silent

# -----------------------
# Stage: builder
# -----------------------
FROM base AS builder
WORKDIR /app

# Copy cached deps and then copy source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args and envs (can be overridden at build time)
ARG BUILD_NODE_ENV=production
ARG NEXT_PUBLIC_MEDIAMTX_API_URL="http://192.168.50.11:80/v3/config"
ENV NEXT_PUBLIC_MEDIAMTX_API_URL=${NEXT_PUBLIC_MEDIAMTX_API_URL}
ARG NEXT_PUBLIC_MEDIAMTX_HLS_URL="http://192.168.50.11:80/hls"
ENV NEXT_PUBLIC_MEDIAMTX_HLS_URL=${NEXT_PUBLIC_MEDIAMTX_HLS_URL}
ENV NODE_ENV=${BUILD_NODE_ENV}
ARG NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}

# Use BuildKit cache mount for Next.js cache to accelerate incremental builds
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    pnpm run build

# -----------------------
# Stage: runtime (minimal)
# -----------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Default runtime envs (these can be overridden at container runtime with -e or --env-file)
ENV NEXT_PUBLIC_MEDIAMTX_API_URL="http://192.168.50.11:80/v3/config"
ENV NEXT_PUBLIC_MEDIAMTX_HLS_URL="http://192.168.50.11:80/hls"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Create non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only runtime artifacts produced by Next.js standalone build
COPY --from=builder /app/public ./public
RUN mkdir -p .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose port (informational)
EXPOSE 3000

# Use non-root user
USER nextjs

# Make it easy to pass runtime envs:
# - docker run -p 3000:3000 -e NODE_ENV=staging -e CUSTOM_VAR=foo my-next-app
# - docker run --env-file ./env.prod -p 3000:3000 my-next-app
CMD ["node", "server.js"]
#CMD ["pnpm", "run", "start"]
