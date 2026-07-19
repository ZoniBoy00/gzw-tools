<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo.png">
  <img src="public/logo.png" alt="GZW Tools" width="120" align="right">
</picture>

# ⚔️ GZW Tools

**Gray Zone Warfare** — Tools, reference, and community API.

[![Vercel](https://img.shields.io/badge/deployed_on-Vercel-000?logo=vercel)](https://gzw-tools.vercel.app)
[![GitHub](https://img.shields.io/badge/private-repo-1a1f26?logo=github)](https://github.com/ZoniBoy00/gzw-tools)

---

## 🎯 Features

### 📈 Reputation Calculator
- **Rep → $** — how much money to reach a vendor rep goal
- **$ → Rep** — how many rep points a dollar amount gets you
- **Mission Calculator** — how many missions of each type you need
- Vendor quick picks (Artisan, Gunny, Banshee…)
- LocalStorage persistence

### 🔫 Ammo Chart
- 70+ ammunition types across 13 calibers
- Penetration ratings against all NIJ armor classes
- Search & caliber filter
- Source & vendor data

### 🔧 Weapons Database
- 34+ weapons with calibers, magazine sizes, sources
- Search by name or caliber
- Filter by weapon type

### 🛡️ Armor Guide
- 17 armor vests with NIJ ratings & materials
- 5 helmets
- Tier-based gear recommendations (Budget → End Game)
- Vendor gear unlock tables

### 🌐 Custom API
- `/api/ammo`, `/api/armor`, `/api/weapons`, `/api/vendors`, `/api/recommendations`
- CORS enabled — anyone can use it
- 1-hour cache
- Response format: `{ data, count, source, timestamp }`

### 🤖 Wiki Scraper
- Fetches game data from GZW Fandom Wiki via MediaWiki API
- `python3 scripts/scraper/scrape.py --all`
- Output: `data/tasks.json`, `data/weapons.json`

---

## 🚀 Quick Start

```bash
# Clone & install
git clone https://github.com/ZoniBoy00/gzw-tools.git
cd gzw-tools
npm install

# Dev server
npm run dev

# Build
npm run build

# Deploy to Vercel
npx vercel --prod
```

### Run the scraper

```bash
cd scripts/scraper
pip install -r requirements.txt
python3 scrape.py --all
```

---

## 🏗️ Project Structure

```
gzw-tools/
├── api/                   # Vercel serverless API endpoints
│   ├── ammo.ts
│   ├── weapons.ts
│   ├── vendors.ts
│   ├── armor/
│   └── recommendations.ts
├── src/                   # React + TypeScript frontend
│   ├── components/        # UI components (tabs, calculators, guides)
│   ├── data/              # Game data (ammo, armor, weapons)
│   ├── lib/               # Utilities and API client
│   └── App.tsx
├── scripts/scraper/       # Wiki scraper (Python)
│   ├── scrape.py          # Main entry point
│   ├── wiki_parser.py     # MediaWiki API client
│   ├── scrapers/          # Page-specific scrapers
│   └── data/              # Scraped JSON output
├── public/                # Static assets
├── vercel.json
└── package.json
```

---

## 📊 Data Sources

| Source | Data | Update |
|--------|------|--------|
| [GZW Wiki](https://gray-zone-warfare.fandom.com) | Tasks, weapons | ⏳ Scraper |
| [GZW Wiki](https://gray-zone-warfare.fandom.com/wiki/Ballistics) | Ammo, armor | ✅ Manual |
| [gzwmap-api](https://github.com/robertarnorsson/gzwmap-api) | Tasks, keys, LZs | 📝 Reference |

---

## 📜 License

Community project — not affiliated with MADFINGER Games or M.A.G. Studios.

Built with React + TypeScript + Tailwind CSS + Vite.
