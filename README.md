# Ads Scraping Dashboard

POC app for scraping Nike ads from Facebook Ads Library and visualizing the results in a dashboard.

## Current Approach

The scraper uses Playwright/Chromium to open the Facebook Ads Library page, bootstrap the public session, capture the page's Ads Library GraphQL request, and replay pagination cursors until it has up to 50 Nike ads. It also falls back to parsing the initially loaded page HTML when pagination is rate-limited.

Stored ad data includes ad ID, active/inactive status, platforms, run dates, the best available image/video asset URL, and the raw source payload for debugging.

## Apps

- `apps/api`: Fastify API, Prisma models, and Playwright scraper
- `apps/web`: React dashboard

## Local Quick Start

```sh
npm install
docker compose up -d postgres redis
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_dashboard?schema=public" \
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Start the API:

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_dashboard?schema=public" \
  API_PORT=3001 \
  npm run dev --workspace @ads-dashboard/api
```

Start the frontend:

```sh
VITE_API_URL="http://localhost:3001" npm run dev --workspace @ads-dashboard/web
```

Open:

```txt
http://localhost:5173
```

## Useful Commands

Run the scraper directly:

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_dashboard?schema=public" \
  npm run scrape --workspace @ads-dashboard/api
```

Run checks:

```sh
npm run typecheck
npm run build
```

## API

- `POST /scrapes`: starts a scrape run
- `GET /scrapes/latest`: returns the latest scrape run
- `GET /ads`: returns scraped ads, with optional `from`, `to`, `status`, and `platform` filters
- `GET /ads/summary`: returns active/inactive counts over time

## Docker

The project includes Dockerfiles and `docker-compose.yml` for the API, web app, Postgres, and Redis.

```sh
docker compose up --build
```

Then apply migrations inside or against the Postgres service:

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_dashboard?schema=public" \
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```
