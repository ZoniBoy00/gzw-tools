# GZW Tools

**Gray Zone Warfare** — fan-made reference tool. Not affiliated with M.A.G. Studios.

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000?logo=vercel)](https://gzw-tools.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Donate](https://img.shields.io/badge/donate-Buy%20me%20a%20coffee-f0b429?logo=buymeacoffee)](https://buymeacoffee.com/zoniboy00)

---

## Features

| Tool | Description |
|------|-------------|
| **Overview** | Dashboard with quick stats, rep progress, gear recommendations |
| **Rep → $** | Calculate cost to reach a target reputation |
| **$ → Rep** | Calculate how much rep you can buy with your budget |
| **Missions** | Browse missions from 7 vendors — search, filter, expand |
| **Ammo** | Full ammo database with caliber, pen values, vendor sources, compare mode |
| **Weapons** | Weapons database with compare mode, filters, detail modals |
| **Armor** | Armor & gear guide with vests, plate carriers, helmets, recommendations |
| **Backpacks** | Backpack & rig database with stats and vendor sources |
| **Keys** 🔑 | Keys & keycards across 12 locations — search by location or name |
| **Vendors** | Vendor guide with rep tracking, per-rank item lists, unlock status (7 vendors) |
| **Loadouts** | Build and save weapon loadouts in your browser (localStorage) |
| **Log Analyzer** | Parse GZW.log files to extract match data |
| **API** | REST API docs for all game data |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Data API:** [gzw-data.vercel.app](https://gzw-data.vercel.app) — proxied through `/api/*` via `vercel.json`
- **Hosting:** Vercel (Hobby)

## Data Sources

All game data is served by the [GZW Data API](https://gzw-data.vercel.app), scraped from the [GZW Fandom Wiki](https://gray-zone-warfare.fandom.com):

- Weapon stats, ammo values, armor data
- Mission objectives & rewards
- Vendor reputation requirements
- Keys & keycards

The frontend never talks to the wiki directly — it fetches everything through the same-origin `/api` proxy (see `vercel.json`), which keeps the app fast and CORS-free. Data refreshes weekly.

## API

The tool includes a REST API at `/api` (proxied to the GZW Data API):

```
GET /api                    API documentation
GET /api/ammo               All ammunition data
GET /api/vendors            Vendor reputation data
GET /api/weapons            Weapons database
GET /api/armor              Armor vests, plate carriers & helmets
GET /api/armor/vests        Vests only
GET /api/armor/helmets      Helmets only
GET /api/recommendations    Gear recommendations
GET /api/missions           Mission database
GET /api/keys               Keys & keycards
GET /api/stats              Aggregate statistics
GET /api/search?q=          Unified search
GET /api/calculator/rep-to-dollars?current=&target=&rate=
GET /api/calculator/missions?current=&target=
```

All endpoints support `?caliber=`, `?vendor=`, `?location=` and other filters.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Project Structure

```
├── public/               # Static assets (favicon, og-image, robots.txt, sitemap)
├── src/
│   ├── components/       # React components
│   │   └── ui/           # Shared UI components (TabBar, ItemModal, StatRow)
│   ├── data/             # Static game data (armor recommendations)
│   ├── hooks/            # Data fetching hooks
│   ├── lib/              # Utilities (API client, calculators, toast, vendor tracker)
│   └── App.tsx           # Root component with routing
├── .github/workflows/    # CI (lint + build on push/PR)
└── vercel.json           # Vercel config (SPA rewrite + API proxy)
```

## License

MIT — use it, modify it, share it. Game content belongs to M.A.G. Studios.