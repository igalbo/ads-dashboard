FROM node:24-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

FROM base AS prod-deps
RUN npm ci --omit=dev --workspace @ads-dashboard/api

FROM base AS build
RUN npm ci --workspace @ads-dashboard/api
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/node_modules/.prisma apps/api/node_modules/.prisma
COPY --from=build /app/apps/api/node_modules/@prisma/client apps/api/node_modules/@prisma/client
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
RUN npx playwright install-deps chromium
RUN npx playwright install chromium
CMD ["node", "dist/server.js"]
