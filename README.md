# Vertical Farm Control PWA

A production-oriented Next.js App Router Progressive Web App for monitoring and operating a vertical farm environment. The UI is designed as a premium dark industrial dashboard with seeded data, offline-capable shell caching, and a code structure prepared for future ESP32 ingestion, tray controls, and persistent history.

## Stack

- Next.js App Router
- TypeScript
- Recharts for interactive analytics
- Custom service worker for installability and offline shell behavior

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
npm run start
```

## Deploy To Vercel

- Import the repository into Vercel as a Next.js project.
- Use Node.js 20 or newer.
- The included [`vercel.json`](./vercel.json) sets cache behavior for the service worker, manifest, and `/images` assets so the PWA works cleanly in deployment.
- No custom server is required. Vercel can build and deploy the app directly with the default `next build` flow.

## Project Notes

- Runtime visuals are served from [`public/images`](./public/images), which maps to the `/images` URL path used throughout the app.
- The dashboard simulates live telemetry and persists the latest snapshot locally so the last known state still renders when offline.
- Mock telemetry is generated in a TypeScript `MockSensorGenerator` using the same top-level payload shape as the ESP32 transmission: `type`, `ts`, `device`, `seq`, `air`, `water`, `light`, and `level`.
- The history page is seeded with analytical mock data and ready to be replaced with backend-fed time series.
- The tray system uses performant CSS conveyor animations with reusable tray state objects.
- The config page is a styled placeholder prepared for future device and farm settings.
