# GZW Tools

**Gray Zone Warfare** — fan-made reference tool. Not affiliated with M.A.G. Studios.

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000?logo=vercel)](https://gzw-tools.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Features

| Tool | Description |
|------|-------------|
| **Overview** | Dashboard with quick stats, rep progress, gear recommendations |
| **Rep → $** | Calculate cost to reach a target reputation |
| **$ → Rep** | Calculate how much rep you can buy with your budget |
| **Missions** | Browse 278 missions from 7 vendors — search, filter, expand |
| **Ammo** | Full ammo database with caliber, pen values, vendor sources |
| **Weapons** | Weapons database (51) with type/source filters, grouped by source, detail modals |
| **Armor** | Armor & gear guide with vests (19), plate carriers (16), helmets (26), recommendations, vendor tables |
| **Backpacks** 🎒 | Backpacks & tactical rigs with search, sort, grid/weight display |
| **Keys** 🔑 | Keys & keycards across 12 locations — search by location or name |
| **Vendors** | Vendor guide with rep tracking, per-rank item lists, unlock status (7 vendors) |
| **Loadouts** | Build and save weapon loadouts in your browser |
| **Log Analyzer** | Parse GZW.log files to extract match data |
| **API** | [gzw-data.vercel.app](https://gzw-data.vercel.app) — public game data API |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Data API:** [gzw-data](https://github.com/ZoniBoy00/gzw-data) — Vercel serverless API + Swagger UI
- **Scraper:** [gzw-scraper](https://github.com/ZoniBoy00/gzw-scraper) — GitHub Actions weekly scrape
- **Hosting:** Vercel (Hobby)

## Data Sources

All game data is scraped from the [GZW Fandom Wiki](https://gray-zone-warfare.fandom.com) via [gzw-scraper](https://github.com/ZoniBoy00/gzw-scraper) (weekly GitHub Actions):
- Weapon stats, ammo values, armor data
- Mission objectives & rewards
- Vendor reputation requirements
- Keys & keycards

Data is served via the public [gzw-data API](https://gzw-data.vercel.app).

## API

The public game data API is hosted at **[gzw-data.vercel.app](https://gzw-data.vercel.app)** ([repo](https://github.com/ZoniBoy00/gzw-data)).

```bash
curl https://gzw-data.vercel.app/api/weapons
curl https://gzw-data.vercel.app/api/armor
curl https://gzw-data.vercel.app/api/keys?location=Ban%20Pa
```

Full API docs with interactive test page: **[gzw-data.vercel.app](https://gzw-data.vercel.app)**

All endpoints return JSON with CORS headers, rate limiting (100 req/min), and filtering support.

### Endpoints

Every dataset is automatically available as `/api/<name>` — no manual registration needed.

| Endpoint | Description | Filters |
|----------|-------------|---------|
| `GET /api/weapons` | Weapons database | `?type=`, `?caliber=`, `?search=` |
| `GET /api/vests` | Armor vests & plate carriers | `?nij=`, `?material=`, `?type=` |
| `GET /api/helmets` | Helmets | `?material=`, `?type=` |
| `GET /api/ammo` | Ammunition & penetration | `?caliber=`, `?search=` |
| `GET /api/backpacks` | Backpacks | `?type=`, `?capacity=` |
| `GET /api/rigs` | Tactical rigs | `?capacity=` |
| `GET /api/keys` | Keys & keycards | `?location=`, `?type=` |
| `GET /api/tasks` | Mission database | `?vendor=`, `?area=`, `?search=` |
| `GET /api/medical` | Medical items | `?type=`, `?effect=` |
| `GET /api/provisions` | Food & drink | `?type=` |
| `GET /api/glasses` | Eyewear | `?type=` |
| `GET /api/factions` | Faction info | — |
| `GET /api/<dataset>` | Any dataset | Auto: filter by any field |
| `GET /api/search?q=` | Cross-dataset search | — |
| `GET /api/stats` | Aggregate stats | — |
| `GET /api/spec` | OpenAPI 3.0 spec | — |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
├── src/
│   ├── components/       # React components
│   │   └── ui/          # Shared UI components (TabBar, ItemModal)
│   ├── data/            # Game data JSON (synced from gzw-data)
│   ├── lib/             # Utilities (calculators, vendor tracker)
│   └── App.tsx          # Root component with routing
├── .github/workflows/   # Data sync from gzw-data
└── vercel.json          # Vercel deployment config
```

## License

MIT — use it, modify it, share it. Game content belongs to M.A.G. Studios.
