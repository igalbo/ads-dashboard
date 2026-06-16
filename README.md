# Ads Scraping Dashboard

POC app for scraping Nike ads from Facebook Ads Library and visualizing the results in a dashboard.

## Current Approach

The scraper uses Playwright to open the Facebook Ads Library page, scroll through the public results, then reads the loaded page HTML and extracts ad data from embedded JSON objects. A GraphQL pagination replay approach is intentionally left as a possible future improvement.

In the current logged-out environment, Facebook renders 30 Nike ads and then the page footer. The scraper is written to keep scrolling until 50 ads are found, but it exits cleanly if the page stops loading more content.

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
