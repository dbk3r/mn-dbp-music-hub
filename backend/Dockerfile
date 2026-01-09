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
RUN yarn install --frozen-lockfile --production=true --ignore-scripts && yarn build 