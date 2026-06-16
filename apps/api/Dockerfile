FROM node:24-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx playwright install-deps chromium
RUN npx playwright install chromium
CMD ["npm", "run", "dev"]
