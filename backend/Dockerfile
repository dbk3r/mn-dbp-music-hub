# --- Build-Stage: Installiere alle Dependencies inkl. dev ---
FROM node:20 AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# --- Build-Stage: Kompiliere TypeScript ---
FROM node:20 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false
COPY . .
RUN yarn build

# --- Runtime-Stage: Nur production-Dependencies ---
FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
RUN apt-get update && apt-get install -y ffmpeg
# Install only production deps in the runtime image
RUN yarn install --frozen-lockfile --production=true --ignore-scripts
# Copy compiled Medusa server output and runtime config from the builder stage
# Medusa's TypeScript build output is in `./.medusa/server` (see tsconfig.json outDir)
COPY --from=builder /app/.medusa/server ./.medusa/server
COPY --from=builder /app/medusa-config.js ./medusa-config.js
# Some runtime tooling may expect tsconfig.json to exist; copy it from the builder
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Start Medusa
CMD ["medusa", "start"]