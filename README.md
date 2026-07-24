# Community Map

House hunting notes and map app for checking listings, nearby transit, and daily-life layers.

## Stack

- Next.js 15
- React 19
- TypeScript
- Leaflet / React-Leaflet
- leaflet.markercluster
- Tailwind CSS
- Shadcn-style UI components
- Next.js API Routes
- PostgreSQL / Neon

## Run Locally

```bash
npm install
npm run dev
```

Production preview:

```bash
npm run build
npm start
```

Same-Wi-Fi Android preview:

```bash
npm run build
npm run start:mobile
```

Then open the network URL shown by Next.js on the Android phone.

## Data

Mutable house data and note history are stored in PostgreSQL:

- `communities`
- `community_note_history`

Static map layer data is stored in JSON:

- `src/data/youbike-stations.json`
- `src/data/bus-stops.json`
- `src/data/schools.json`
- `src/data/convenience-stores.json`

## PostgreSQL / Neon

Set `DATABASE_URL` first. For Neon, use the connection string with SSL:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

Create or update database tables:

```bash
npm run db:setup
```

Import current JSON house and note data into PostgreSQL:

```bash
npm run db:seed
```

On Vercel, add the same `DATABASE_URL` in Project Settings > Environment Variables.

## Import Layers

```bash
npm run import:youbike
npm run import:schools
npm run import:convenience
```

Bus stops use TDX credentials:

```bash
set TDX_CLIENT_ID=your-client-id
set TDX_CLIENT_SECRET=your-client-secret
npm run import:bus
```

Alternatively set `TDX_ACCESS_TOKEN`.

## Android / PWA

This project includes PWA files:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/app-icon-192.png`
- `public/icons/app-icon-512.png`

For real Android installation from Chrome, deploy the app with HTTPS first, then open the HTTPS URL and choose "Add to Home screen" or "Install app".
