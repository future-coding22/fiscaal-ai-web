# ----------------------------------------------------------------
# Stage 1: Dependency Installation (Caching)
# -------------------------------------------------------------
FROM node:20-alpine AS deps

# Install dependencies in the base environment
WORKDIR /app
COPY package.json package-lock.json ./
# Use npm ci for clean, deterministic install
RUN npm ci --omit=dev

# ----------------------------------------------------------------
# Stage 2: Build Application (Fix for Native Modules like lightningcss)
# ----------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app
# 1. Copy dependency files (package.json/lock)
COPY package.json package-lock.json ./
# 2. Copy source code
COPY . .

# CRITICAL FIX: Run a clean install in the builder stage.
# This ensures native modules like 'lightningcss' are correctly built/linked
# for this specific stage, resolving the "Cannot find module" error.
RUN npm ci

# Environment variables for the build process
ENV NEXT_TELEMETRY_DISABLED=1

# Run the Next.js build command
RUN npm run build

# ----------------------------------------------------------------
# Stage 3: Production Server (Final Image)
# ----------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install Python, pip, and required build tools for Python SDKs
# Includes 'cargo' (Rust compiler) for dependencies like 'cryptography'.
RUN apk add --no-cache bash git procps docker-cli curl github-cli \
        python3 py3-pip \
        # Packages required for compiling native extensions
        build-base \
        python3-dev \
        libffi-dev \
        openssl-dev \
        cargo \
    && pip install --no-cache-dir --break-system-packages google-genai openai anthropic \
    && npm install -g @google/gemini-cli @anthropic-ai/claude-code \
    # Remove build dependencies to keep the final image size small
    && apk del build-base python3-dev libffi-dev openssl-dev cargo

ENV SHELL=/bin/sh

# Copy only the necessary files for running the application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.git ./.git

# Expose the default Next.js port
EXPOSE 3000


# Set environment variables for production (Legacy format warnings fixed)
ENV NODE_ENV=production
ENV PORT=3000

# Start the Next.js application
CMD ["npm", "start"]

