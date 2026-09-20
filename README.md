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
| **Missions** | Browse mission data by vendor, area, type, and category |
| **Ammo** | Full ammo database with caliber, pen values, vendor sources |
| **Weapons** | Weapons database with compare mode, filters, detail modals |
| **Armor** | Armor & gear guide with vests, plate carriers, helmets, recommendations |
| **Keys** 🔑 | Search keys and keycards by location or name |
| **Vendors** | Vendor guide with rep tracking, per-rank item lists, unlock status (7 vendors) |
| **Loadouts** | Build and save weapon loadouts in your browser |
| **Log Analyzer** | Parse GZW.log files to extract match data |
| **API Docs** | Explore the public GZW Data API contract |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Data API:** [gzw-data.dev/api/v1](https://gzw-data.dev/api/v1)
- **Data source:** [gzw-scraper](https://github.com/ZoniBoy00/gzw-scraper) → GZW Data API
- **Hosting:** Vercel (Hobby)

## Data Sources

All game data is sourced from the public [GZW Data API](https://gzw-data.dev/api/v1),
which is maintained by the separate scraper pipeline:
- Weapon stats, ammo values, armor data
- Mission objectives & rewards
- Vendor reputation requirements
- Keys & keycards

The API publishes a `dataVersion` snapshot timestamp. The frontend displays that
snapshot in the application shell instead of inventing a static refresh date.

## API

The tool consumes the versioned GZW Data API:

```
GET https://gzw-data.dev/api/v1       API root
GET https://gzw-data.dev/api/v1/ammo  Ammunition dataset
GET https://gzw-data.dev/api/v1/weapons Weapons dataset
GET https://gzw-data.dev/api/v1/armor  Combined armor route
GET https://gzw-data.dev/api/v1/tasks  Mission/task data
GET https://gzw-data.dev/api/v1/keys   Keys and keycards
GET https://gzw-data.dev/api/v1/stats  Aggregate statistics
GET https://gzw-data.dev/api/v1/search?q= Unified search
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

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

```
├── src/
│   ├── components/       # Tool screens, shell, and shared UI
│   ├── data/             # Frontend domain types and static recommendations
│   ├── lib/              # API adapter, calculators, storage, context
│   └── App.tsx           # Root component and route splitting
├── .github/workflows/   # Frontend quality CI
└── vercel.json          # Vercel deployment config
```

## License

MIT — use it, modify it, share it. Game content belongs to M.A.G. Studios.
