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
| **Missions** | Browse 159 missions from 6 vendors — search, filter, expand |
| **Ammo** | Full ammo database with caliber, pen values, vendor sources |
| **Weapons** | Weapons database with compare mode, filters, detail modals |
| **Armor** | Armor & gear guide with recommendations, compare, vendor gear |
| **Keys** 🔑 | 103 keys & keycards across 12 locations — search by location or name |
| **Vendors** | Vendor guide with rep tracking, per-rank item lists, unlock status |
| **Loadouts** | Build and save weapon loadouts in your browser |
| **Log Analyzer** | Parse GZW.log files to extract match data |
| **API** | REST API for all game data |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Vercel serverless functions (Node.js)
- **Data:** Scraped from [GZW Fandom Wiki](https://gray-zone-warfare.fandom.com)
- **Hosting:** Vercel (Hobby)

## Data Sources

All game data is scraped from the [GZW Fandom Wiki](https://gray-zone-warfare.fandom.com) via GitHub Actions:
- Weapon stats, ammo values, armor data
- Mission objectives & rewards
- Vendor reputation requirements
- Keys & keycards

Data refreshes automatically every Monday via the GitHub Actions scraper.

## API

The tool includes a REST API at `/api`:

```
GET /api                    API documentation
GET /api/ammo               All ammunition data
GET /api/vendors            Vendor reputation data
GET /api/weapons            Weapons database
GET /api/armor              Armor vests & helmets
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

# Scrape wiki data
python3 scripts/scraper/scrape.py --all
python3 scripts/scraper/enrich_tasks.py
python3 scripts/scraper/categorize_tasks.py
python3 scripts/scraper/gen_frontend_data.py
```

## Project Structure

```
├── api/                  # Vercel serverless function (REST API)
│   └── index.js
├── src/
│   ├── components/       # React components
│   │   └── ui/          # Shared UI components (TabBar, ItemModal)
│   ├── data/            # Game data (JSON + TS)
│   ├── lib/             # Utilities (calculators, vendor tracker)
│   └── App.tsx          # Root component with routing
├── scripts/
│   └── scraper/         # Wiki scraping pipeline
├── .github/workflows/   # GitHub Actions (weekly data refresh)
└── vercel.json          # Vercel deployment config
```

## License

MIT — use it, modify it, share it. Game content belongs to M.A.G. Studios.
