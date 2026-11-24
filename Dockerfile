# Image produksi: Next.js standalone (server.js) di atas Node 22 Alpine.
# Dua target yang dipakai CI:
#   --target runner    -> image aplikasi  (tag :latest dan :sha-xxxxxxx)
#   --target migrator  -> image job migrasi Drizzle (tag :migrate)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Unggahan bukti pembayaran/dokumen disimpan di volume ini.
RUN mkdir -p /app/storage/uploads && chown -R nextjs:nodejs /app/storage
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:22-alpine AS migrator
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json drizzle.config.ts tsconfig.json ./
COPY drizzle ./drizzle
COPY src/server/db ./src/server/db
CMD ["npx", "drizzle-kit", "migrate"]
