# Ads Scraping Dashboard

POC app for scraping Nike ads from Facebook Ads Library and visualizing the results in a dashboard.

## Current Approach

The scraper uses Playwright/Chromium to open the Facebook Ads Library page, bootstrap the public session, capture Ads Library GraphQL responses, and keep loading results until it has up to 50 Nike ads.

Stored ad data includes ad ID, active/inactive status, platforms, run dates, the best available image/video asset URL, and the raw source payload for debugging.

## Apps

- `apps/api`: Fastify API, Prisma models, and Playwright scraper
- `apps/web`: React dashboard

## Local Quick Start

```sh
npm install
cp .env.example .env.local
docker compose up -d postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_dashboard?schema=public" \
npm exec --workspace @ads-dashboard/api -- prisma migrate deploy --schema prisma/schema.prisma
```

Start the API and frontend:

```sh
npm run dev
```

Open:

```txt
http://localhost:5173
```

The API listens on `http://localhost:3001`; opening that URL directly returns API responses, not the dashboard.

## Useful Commands

Run the scraper directly:

```sh
npm run scrape --workspace @ads-dashboard/api
```

Run checks:

```sh
npm test
npm run typecheck
npm run build
```

## API

- `POST /scrapes`: starts a scrape run
- `GET /scrapes/latest`: returns the latest scrape run
- `GET /ads`: returns paginated scraped ads, with optional `from`, `to`, `status`, and repeated `platform` filters
- `GET /ads/facets`: returns filter values from the full database
- `GET /ads/summary`: returns active/inactive counts over time

## Docker

The project includes production Dockerfiles and `docker-compose.yml` for the API, web app, and Postgres.

```sh
docker compose up --build -d
```

Apply migrations through the API image:

```sh
docker compose exec api npx prisma migrate deploy --schema prisma/schema.prisma
```

Open `http://localhost:5173`. The API is exposed at `http://localhost:3001`.
