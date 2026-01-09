## Builder: install (dev+prod) and build
FROM node:20 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
# Install all deps (including dev) so build and postinstall scripts run
RUN yarn install --frozen-lockfile --production=false
COPY . .
RUN yarn build

## Runner: production runtime image
FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime system deps (ffmpeg) and clean apt lists
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ffmpeg \
	&& rm -rf /var/lib/apt/lists/*

# Copy package metadata
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Copy preinstalled node_modules from builder to ensure native addons/postinstall
COPY --from=builder /app/node_modules ./node_modules

# Copy only the built server output and runtime config
# Medusa's TypeScript build output is in `./.medusa/server` (see tsconfig.json outDir)
COPY --from=builder /app/.medusa/server ./.medusa/server
COPY --from=builder /app/medusa-config.js ./medusa-config.js
# Also copy the built admin/public files to the expected public/admin path
COPY --from=builder /app/.medusa/server/public ./public

# Use yarn start so package.json start script is respected
CMD ["yarn", "start"]