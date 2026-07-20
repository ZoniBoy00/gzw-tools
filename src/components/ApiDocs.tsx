import { useState } from 'react';

interface Param {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface Endpoint {
  method: string;
  path: string;
  desc: string;
  params: Param[];
  example: string;
  group: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api',
    desc: 'Root endpoint — returns API metadata, version, and a list of all available endpoints.',
    params: [],
    example: `{\n  "data": {\n    "name": "GZW Tools API",\n    "version": "1.0.0",\n    "endpoints": [\n      "/api/ammo?caliber=5.56x45mm",\n      "/api/vendors",\n      "/api/weapons",\n      "/api/armor",\n      "/api/armor/vests",\n      "/api/armor/helmets",\n      "/api/armor/plate-carriers",\n      "/api/recommendations",\n      "/api/backpacks",\n      "/api/keys?location=Fort%20Narith",\n      "/api/missions?vendor=Handshake",\n      "/api/stats",\n      "/api/search?q=AK",\n      "/api/calculator/rep-to-dollars?current=5000&target=13000"\n    ]\n  },\n  "count": 1,\n  "source": "GZW Tools API",\n  "timestamp": "2026-01-15T12:00:00.000Z"\n}`,
    group: 'System',
  },
  {
    method: 'GET',
    path: '/api/vendors',
    desc: 'Returns all seven GZW vendors with their current reputation, max rep, and descriptions.',
    params: [],
    example: `{\n  "data": [\n    {\n      "name": "Handshake",\n      "slug": "handshake",\n      "currentRep": 7277,\n      "maxRep": 13000,\n      "description": "Early missions & gear"\n    },\n    {\n      "name": "Gunny",\n      "slug": "gunny",\n      "currentRep": 5000,\n      "maxRep": 13000,\n      "description": "Ammo & Weapon Mods"\n    }\n  ]\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/ammo',
    desc: 'List all ammunition. Filter by caliber to narrow results.',
    params: [
      { name: 'caliber', type: 'string', required: false, desc: 'Filter by exact caliber (e.g. "5.56x45mm")' },
    ],
    example: `// GET /api/ammo?caliber=5.56x45mm\n{\n  "data": {\n    "0": {\n      "caliber": "5.56x45mm",\n      "name": "AP (M855A1)",\n      "speed": 970,\n      "accMod": 7,\n      "durMod": -40,\n      "pen": {\n        "I": 2, "IIA": 2, "IIIA": 2,\n        "III": 2, "III+": 2, "III++": 2\n      },\n      "vendor": "Gunny",\n      "repLevel": 3\n    },\n    "calibers": ["5.56x45mm", "7.62x39mm", ...]\n  }\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/weapons',
    desc: 'Browse weapons with optional type, caliber, and text search filters.',
    params: [
      { name: 'type', type: 'string', required: false, desc: 'Filter by weapon type (e.g. "Assault Rifle", "SMG")' },
      { name: 'caliber', type: 'string', required: false, desc: 'Filter by caliber' },
      { name: 'search', type: 'string', required: false, desc: 'Text search across name and caliber' },
    ],
    example: `// GET /api/weapons?type=Assault%20Rifle\n{\n  "data": [\n    {\n      "name": "M4A1",\n      "type": "Assault Rifle",\n      "caliber": "5.56x45mm",\n      "magSize": 30,\n      "source": "Gunny R.2"\n    },\n    {\n      "name": "AK-74M",\n      "type": "Assault Rifle",\n      "caliber": "5.45x39mm",\n      "magSize": 30,\n      "source": "Turncoat R.2"\n    }\n  ]\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/armor',
    desc: 'Returns all vests, plate carriers, and helmets in a single response.',
    params: [],
    example: `{\n  "data": {\n    "vests": [\n      { "name": "Molle Vest", "nij": "IIIA", "material": "Steel", "weight": 2.6, "source": "Artisan R.1" }\n    ],\n    "plateCarriers": [\n      { "name": "Specter", "nij": "IIIA", "material": "Aramid", "weight": 2.8, "source": "Handshake R.1" }\n    ],\n    "helmets": [\n      { "name": "FAST Carbon", "nij": "IIIA", "material": "Aramid", "weight": 1.1, "source": "Banshee R.2" }\n    ]\n  }\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/armor/vests',
    desc: 'Returns only vest/body armor data.',
    params: [],
    example: `{\n  "data": [\n    {\n      "name": "LVS Tactical (Multicam)",\n      "nij": "III++",\n      "material": "Ceramic",\n      "plates": "Front, Back, Sides",\n      "grid": "3×3",\n      "weight": 8.2,\n      "source": "Handshake R.4"\n    }\n  ]\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/armor/helmets',
    desc: 'Returns only helmet data.',
    params: [],
    example: `{\n  "data": [\n    {\n      "name": "ACH (Olive)",\n      "nij": "IIIA",\n      "material": "Aramid",\n      "weight": 1.5,\n      "source": "Turncoat R.2"\n    }\n  ]\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/armor/plate-carriers',
    desc: 'Returns only plate carrier data.',
    params: [],
    example: `{\n  "data": [\n    {\n      "name": "Plate6 Plate Carrier",\n      "nij": "III++",\n      "material": "Ceramic",\n      "plates": "Front, Back",\n      "grid": "4x4",\n      "weight": 9.6,\n      "source": "Handshake R.4"\n    }\n  ]\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/recommendations',
    desc: 'Gear loadout recommendations from budget to end-game, plus vendor gear unlock table.',
    params: [],
    example: `{\n  "data": {\n    "recommendations": [\n      {\n        "tier": "T1",\n        "label": "Budget",\n        "vest": "Molle Vest IIIA",\n        "helmet": "SS-27 IIA",\n        "ammo": "FMJ / M193",\n        "notes": "Good vs AI"\n      }\n    ],\n    "vendorGear": [\n      { "vendor": "Handshake", "rep": 1, "items": "Commander IIIA, LVS Overt IIIA+" }\n    ]\n  }\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/backpacks',
    desc: 'Returns all backpacks and tactical rigs with weight, grid size, and images.',
    params: [],
    example: `{\n  "data": {\n    "backpacks": [\n      { "name": "Assault Backpack", "id": "assault-backpack", "type": "Backpack", "weight": 1.5, "grid": "4x4", "image": "https://..." }\n    ],\n    "rigs": [\n      { "name": "Biker Chest Rig", "id": "biker-chest-rig", "type": "Tactical Rig", "weight": 0.35, "grid": "2x3", "image": "https://..." }\n    ]\n  }\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/keys',
    desc: 'All keys & keycards across 12 locations, with wiki links and images. Filter by location.',
    params: [
      { name: 'location', type: 'string', required: false, desc: 'Filter by location (e.g. "Fort Narith", "Tiger Bay")' },
    ],
    example: `// GET /api/keys?location=Fort%20Narith\\n{\\n  "data": {\\n    "keys": [\\n      {\\n        "name": "A103 Key",\\n        "location": "Fort Narith",\\n        "wikiUrl": "https://...",\\n        "image": "https://...",\\n        "inTask": false\\n      }\\n    ],\\n    "locations": ["Ban Pa", "Blue Lagoon", ...]\\n  }\\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/missions',
    desc: 'Mission database with vendor and area filters.',
    params: [
      { name: 'vendor', type: 'string', required: false, desc: 'Filter by vendor name' },
      { name: 'area', type: 'string', required: false, desc: 'Filter by area name' },
      { name: 'search', type: 'string', required: false, desc: 'Text search across name, area, and vendor' },
    ],
    example: `// GET /api/missions?vendor=Handshake\\n{\\n  "data": [\\n    {\\n      "id": "fresh-meat",\\n      "name": "Fresh Meat",\\n      "vendor": "Handshake",\\n      "area": "Lamang"\\n    }\\n  ]\\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/stats',
    desc: 'Aggregate statistics: totals for weapons, ammo, armor, vendors, missions, and keys.',
    params: [],
    example: `{\\n  "data": {\\n    "weapons": { "total": 51, "types": ["Assault Rifle", "DMR", ...] },\\n    "ammo": { "total": 56, "calibers": ["5.56x45mm", ...] },\\n    "armor": { "vests": 19, "helmets": 26, "plateCarriers": 16 },\\n    "backpacks": { "total": 16 },\\n    "rigs": { "total": 11 },\\n    "keys": { "total": 124, "locations": ["Ban Pa", ...] }\\n  }\\n}`,
    group: 'Data',
  },
  {
    method: 'GET',
    path: '/api/search',
    desc: 'Unified search across weapons, ammo, armor, and missions.',
    params: [
      { name: 'q', type: 'string', required: true, desc: 'Search query' },
    ],
    example: `// GET /api/search?q=AK\\n{\\n  "data": {\\n    "query": "AK",\\n    "weapons": [...],\\n    "ammo": [...],\\n    "vests": [...],\\n    "helmets": [...],\\n    "missions": [...]\\n  }\\n}`,
    group: 'System',
  },
  {
    method: 'GET',
    path: '/api/calculator/rep-to-dollars',
    desc: 'Calculate total cost to reach a target reputation.',
    params: [
      { name: 'current', type: 'number', required: false, desc: 'Current reputation (default: 0)' },
      { name: 'target', type: 'number', required: false, desc: 'Target reputation (default: 13000)' },
      { name: 'rate', type: 'number', required: false, desc: 'Dollars per rep point (default: 100)' },
    ],
    example: `// GET /api/calculator/rep-to-dollars?current=5000&target=13000&rate=100\\n{\\n  "data": {\\n    "current": 5000,\\n    "target": 13000,\\n    "diff": 8000,\\n    "cost": 800000,\\n    "progressPct": 38.46\\n  }\\n}`,
    group: 'Calculators',
  },
  {
    method: 'GET',
    path: '/api/calculator/missions',
    desc: 'Calculate how many missions of each type are needed to reach a rep goal.',
    params: [
      { name: 'current', type: 'number', required: false, desc: 'Current reputation (default: 0)' },
      { name: 'target', type: 'number', required: false, desc: 'Target reputation (default: 13000)' },
    ],
    example: `// GET /api/calculator/missions?current=0&target=5000\\n{\\n  "data": {\\n    "current": 0,\\n    "target": 5000,\\n    "needed": 5000,\\n    "breakdown": [\\n      { "type": "Critical Op", "repEach": 200, "count": 25 }\\n    ]\\n  }\\n}`,
    group: 'Calculators',
  },
];

const GROUPS = [...new Set(ENDPOINTS.map((e) => e.group))];

const METHOD_STYLES: Record<string, string> = {
  GET: 'text-green border-green/30 bg-green/5',
};

export default function ApiDocs() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const filtered = groupFilter ? ENDPOINTS.filter((e) => e.group === groupFilter) : ENDPOINTS;

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-code text-accent text-sm" />
        <span className="section-title">API Documentation</span>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Public REST API for GZW Tools. All endpoints return JSON with CORS headers.
        Base URL:{' '}
        <a
          href="https://gzw-tools.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent/80 hover:text-accent underline underline-offset-2"
        >
          https://gzw-tools.vercel.app
        </a>
      </p>

      {/* Group filter chips */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setGroupFilter(null)}
          className={`text-[10px] font-mono px-3 py-1.5 border transition-colors ${
            !groupFilter
              ? 'border-accent/40 bg-accent/5 text-accent'
              : 'border-border text-text-muted hover:border-text-muted/30'
          }`}
        >
          All
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`text-[10px] font-mono px-3 py-1.5 border transition-colors ${
              groupFilter === g
                ? 'border-accent/40 bg-accent/5 text-accent'
                : 'border-border text-text-muted hover:border-text-muted/30'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Endpoint list */}
      <div className="space-y-1.5 animate-stagger">
        {filtered.map((ep) => {
          const key = `${ep.method} ${ep.path}`;
          const open = expanded === key;
          return (
            <div key={key} className="card card-highlight overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : key)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border ${METHOD_STYLES[ep.method] || ''}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-text truncate">{ep.path}</code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-muted hidden sm:block max-w-[240px] truncate">{ep.desc}</span>
                  <i
                    className={`fas fa-chevron-down text-[10px] text-text-muted transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {open && (
                <div
                  className="border-t border-border px-3.5 pb-4 pt-3"
                  style={{ animation: 'fadeInUp 0.2s ease-out' }}
                >
                  {/* Description */}
                  <p className="text-xs font-mono text-text-muted mb-3">{ep.desc}</p>

                  {/* Parameters */}
                  {ep.params.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5">
                        <i className="fas fa-list text-accent/60 mr-1" />
                        Parameters
                      </div>
                      <div className="space-y-1">
                        {ep.params.map((p) => (
                          <div key={p.name} className="flex items-center gap-2.5 text-xs font-mono bg-surface-2 px-3 py-1.5">
                            <code className="text-accent font-medium">{p.name}</code>
                            <span className="text-text-muted/60 text-[10px]">{p.type}</span>
                            {p.required && <span className="tag tag-amber text-[9px]">required</span>}
                            <span className="text-text-muted/80">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example Response */}
                  <div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5">
                      <i className="fas fa-terminal text-accent/60 mr-1" />
                      Example Response
                    </div>
                    <pre className="bg-surface-2 border border-border p-3 text-xs font-mono text-green/90 overflow-x-auto leading-relaxed">
                      {ep.example}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-muted text-xs font-mono">No endpoints match this filter.</div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 border border-border p-3">
        <div className="flex items-center gap-2 mb-1">
          <i className="fas fa-shield-halved text-accent/60 text-[10px]" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-text-muted">Rate Limits & Headers</span>
        </div>
        <div className="space-y-1 text-[10px] font-mono text-text-muted/70">
          <div>
            <span className="text-text-muted">Cache:</span> All responses include{' '}
            <code className="text-accent/70">Cache-Control: public, max-age=3600</code>
          </div>
          <div>
            <span className="text-text-muted">CORS:</span> Open to all origins via{' '}
            <code className="text-accent/70">Access-Control-Allow-Origin: *</code>
          </div>
          <div>
            <span className="text-text-muted">Rate Limit:</span> 100 requests per minute per IP
          </div>
          <div>
            <span className="text-text-muted">Format:</span> All responses wrap data in{' '}
            <code className="text-accent/70">{`{ data, count, source, timestamp }`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
