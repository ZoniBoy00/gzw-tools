import { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapContainer, ImageOverlay, Marker, Popup, Polyline,
  useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import mapData from '../data/map_data.json';

/* ── Constants ── */
const GRID_MIN_X = 90;
const GRID_MAX_X = 230;
const GRID_MIN_Y = 90;
const GRID_MAX_Y = 190;
const DATA_RANGE_X = GRID_MAX_X - GRID_MIN_X; // 140
const DATA_RANGE_Y = GRID_MAX_Y - GRID_MIN_Y; // 100

// Image pixel dimensions (wiki map: 1861×936) — used to render at native aspect ratio
const MAP_W = 1861;
const MAP_H = 936;

const COLORS: Record<string, string> = {
  city: '#f59e0b',
  town: '#e8b830',
  poi: '#3b82f6',
  cop_major: '#a855f7',
  cop_minor: '#8b5cf6',
  lz: '#22c55e',
  key: '#ef4444',
  task: '#f97316',
};

interface FilterCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  group: 'locations' | 'combat' | 'transport' | 'objectives';
}

const CATEGORIES: FilterCategory[] = [
  { key: 'all',    label: 'Show All',   icon: 'fas fa-map',         color: '#fff',     group: 'locations' },
  { key: 'town',   label: 'Towns',      icon: 'fas fa-city',        color: COLORS.town, group: 'locations' },
  { key: 'poi',    label: 'POIs',       icon: 'fas fa-location-dot', color: COLORS.poi,  group: 'locations' },
  { key: 'places', label: 'Places',     icon: 'fas fa-house',       color: '#6b7280',  group: 'locations' },
  { key: 'cop',    label: 'COPs',       icon: 'fas fa-shield-halved', color: COLORS.cop_major, group: 'combat' },
  { key: 'lz',     label: 'Landing Zones', icon: 'fas fa-helicopter', color: COLORS.lz, group: 'transport' },
  { key: 'key',    label: 'Keys',       icon: 'fas fa-key',         color: COLORS.key, group: 'objectives' },
  { key: 'task',   label: 'Tasks',      icon: 'fas fa-clipboard-list', color: COLORS.task, group: 'objectives' },
];

const GROUP_LABELS: Record<string, string> = {
  locations: 'LOCATIONS',
  combat: 'COMBAT',
  transport: 'TRANSPORT',
  objectives: 'OBJECTIVES',
};

/* ── Coordinate helpers ── */

// Convert wiki grid "X:Y" (e.g. "141:164") to Leaflet pixel position [y, x]
// Uses proportional mapping: grid (90-230, 90-190) → image pixels (0-1861, 0-936)
function parseGrid(g: string): [number, number] {
  const [x, y] = g.replace(/\s/g, '').split(':').map(Number);
  const px = ((x - GRID_MIN_X) / DATA_RANGE_X) * MAP_W;
  const py = ((y - GRID_MIN_Y) / DATA_RANGE_Y) * MAP_H;
  return [py, px]; // Leaflet CRS.Simple: [y, x]
}

/* ── Marker icon factory (pin-style) ── */
function createIcon(color: string, size: number, icon?: string, label?: string, showName?: string) {
  const iconSize = Math.max(size, 18);
  const iconF = icon ? Math.round(iconSize * 0.42) : Math.round(iconSize * 0.38);
  const borderW = Math.max(2, Math.round(iconSize * 0.1));
  const pinH = Math.round(iconSize * 0.28);
  const totalH = iconSize + pinH;
  const labelHtml = label && icon
    ? `<span style="
        position:absolute;top:-10px;left:50%;transform:translateX(-50%);
        font-size:7px;font-weight:700;font-family:'Rajdhani',sans-serif;
        color:#fff;text-shadow:0 1px 6px rgba(0,0,0,0.9);
        white-space:nowrap;letter-spacing:0.3px;
        background:${color}cc;padding:1px 5px;border-radius:2px;
        backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.15);
      ">${label}</span>`
    : '';
  const nameHtml = showName
    ? `<span style="
        position:absolute;top:${totalH - 2}px;left:50%;transform:translateX(-50%);
        font-size:8px;font-weight:700;font-family:'Rajdhani',sans-serif;
        color:#fff;text-shadow:0 1px 8px rgba(0,0,0,0.95),0 0 4px rgba(0,0,0,0.8);
        white-space:nowrap;letter-spacing:0.5px;
        text-transform:uppercase;
        background:rgba(0,0,0,0.5);padding:1px 6px;border-radius:2px;
        border:1px solid rgba(255,255,255,0.1);
      ">${showName}</span>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${iconSize + 8}px;height:${totalH + 24}px;">
      ${labelHtml}
      <div style="
        width:${iconSize}px;height:${iconSize}px;
        background:${color};
        border:${borderW}px solid rgba(255,255,255,0.3);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.5), 0 0 12px ${color}66;
        display:flex;align-items:center;justify-content:center;
        position:absolute;top:0;left:4px;
      ">
        <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
          ${icon ? `<i class="${icon}" style="font-size:${iconF}px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.6);"></i>`
            : label ? `<span style="font-size:${iconF - 2}px;font-weight:700;color:#fff;font-family:'Rajdhani','JetBrains Mono',monospace;text-shadow:0 1px 3px rgba(0,0,0,0.6);">${label}</span>` : ''}
        </div>
      </div>
      ${nameHtml}
    </div>`,
    iconSize: [iconSize + 8, totalH + 24],
    iconAnchor: [iconSize / 2 + 4, totalH],
    popupAnchor: [0, -totalH - 24],
  });
}

/* ── Fit map bounds on mount ── */
function FitBounds() {
  const map = useMap();
  useEffect(() => { map.fitBounds([[0, 0], [MAP_H, MAP_W]]); }, [map]);
  return null;
}

/* ── Grid overlay ── */
function GridOverlay() {
  const lines: { from: [number, number]; to: [number, number] }[] = [];
  // Vertical lines (every 10 units in data coordinates)
  for (let gx = 100; gx <= 220; gx += 10) {
    const lx = ((gx - GRID_MIN_X) / DATA_RANGE_X) * MAP_W;
    lines.push({ from: [0, lx], to: [MAP_H, lx] });
  }
  // Horizontal lines (every 10 units)
  for (let gy = 100; gy <= 180; gy += 10) {
    const ly = ((gy - GRID_MIN_Y) / DATA_RANGE_Y) * MAP_H;
    lines.push({ from: [ly, 0], to: [ly, MAP_W] });
  }
  return (
    <>
      {lines.map((l, i) => (
        <Polyline key={i} positions={[l.from, l.to]} color="rgba(255,255,255,0.07)" weight={1} interactive={false} />
      ))}
    </>
  );
}

/* ── Grid labels on edges ── */
function GridLabels() {
  const labels: { pos: [number, number]; text: string; isX: boolean }[] = [];
  // X-axis labels (top edge)
  for (let gx = 100; gx <= 220; gx += 10) {
    const lx = ((gx - GRID_MIN_X) / DATA_RANGE_X) * MAP_W;
    labels.push({ pos: [MAP_H + 2, lx], text: `${gx}`, isX: true });
  }
  // Y-axis labels (left edge)
  for (let gy = 100; gy <= 180; gy += 10) {
    const ly = ((gy - GRID_MIN_Y) / DATA_RANGE_Y) * MAP_H;
    labels.push({ pos: [ly, -2], text: `${gy}`, isX: false });
  }
  return (
    <>
      {labels.map((l, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<span style="font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.25);text-shadow:0 0 6px rgba(0,0,0,0.9);">${l.text}</span>`,
          iconSize: [24, 10],
          iconAnchor: l.isX ? [12, 0] : [0, 5],
        });
        return <Marker key={i} position={l.pos} icon={icon} interactive={false} />;
      })}
    </>
  );
}

/* ── Mouse coordinate tracker ── */
function MouseTracker({ onMove, onZoom }: { onMove: (g: [number, number]) => void; onZoom: (z: number) => void }) {
  useMapEvents({
    mousemove: (e) => {
      // e.latlng is [y, x] in CRS.Simple
      const gx = Math.round((e.latlng.lng / MAP_W) * DATA_RANGE_X + GRID_MIN_X);
      const gy = Math.round((e.latlng.lat / MAP_H) * DATA_RANGE_Y + GRID_MIN_Y);
      if (gx >= GRID_MIN_X && gx <= GRID_MAX_X && gy >= GRID_MIN_Y && gy <= GRID_MAX_Y) {
        onMove([gx, gy]);
      }
    },
    zoom: (e) => { onZoom(e.target.getZoom()); },
  });
  return null;
}

/* ── Type for flat marker list ── */
interface MarkerItem {
  pos: [number, number];
  name: string;
  desc?: string;
  color: string;
  icon: string;
  size: number;
  label?: string;
  showName?: string;
  category: string;
}

/* ── MapView component ── */
export default function MapView() {
  const [filter, setFilter] = useState('all');
  const [showGrid, setShowGrid] = useState(false);
  const [cursorGrid, setCursorGrid] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  /* Track fullscreen changes */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* Toggle fullscreen */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  /* Build markers from map_data.json */
  const markers = useMemo(() => {
    const result: MarkerItem[] = [];
    const show = (f: string) => filter === 'all' || filter === f;

    /* Towns / cities / POIs */
    if (show('town') || show('poi') || show('all')) {
      for (const poi of mapData.majorPOIs) {
        const cat = poi.type === 'city' || poi.type === 'town' ? 'town' : 'poi';
        if (filter !== 'all' && cat !== filter) continue;
        result.push({
          pos: parseGrid(poi.grid),
          name: poi.name,
          desc: poi.desc,
          color: COLORS[poi.type] || COLORS.poi,
          icon: poi.type === 'city' ? 'fas fa-building' : poi.type === 'town' ? 'fas fa-city' : 'fas fa-location-dot',
          size: poi.type === 'city' ? 30 : 22,
          label: poi.type === 'city' ? poi.name : undefined,
          showName: poi.type === 'city' || poi.type === 'town' ? poi.name : undefined,
          category: cat,
        });
      }
    }

    /* COPs */
    if (show('cop')) {
      for (const cop of mapData.majorCOPs || []) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          desc: 'Major Combat Outpost',
          color: COLORS.cop_major,
          icon: 'fas fa-shield-halved',
          size: 22,
          label: cop.name,
          category: 'cop',
        });
      }
      for (const cop of mapData.minorCOPs || []) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          desc: `Minor COP (${cop.region})`,
          color: COLORS.cop_minor,
          icon: 'fas fa-shield',
          size: 16,
          category: 'cop',
        });
      }
    }

    /* Landing Zones */
    if (show('lz')) {
      for (const lz of (mapData as any).landingZones || []) {
        if (!lz.grid) continue;
        result.push({
          pos: parseGrid(lz.grid),
          name: lz.name,
          desc: `LZ (${lz.region})`,
          color: COLORS.lz,
          icon: 'fas fa-helicopter',
          size: 22,
          label: lz.name,
          category: 'lz',
        });
      }
    }

    /* Key locations */
    if (show('key')) {
      for (const k of (mapData as any).keyLocations || []) {
        if (!k.grid) continue;
        result.push({
          pos: parseGrid(k.grid),
          name: k.name,
          desc: `Key spawn (${k.region})`,
          color: COLORS.key,
          icon: 'fas fa-key',
          size: 16,
          category: 'key',
        });
      }
    }

    /* Minor POIs / Places */
    if (show('places')) {
      for (const p of (mapData as any).minorPOIs || []) {
        if (!p.grid) continue;
        result.push({
          pos: parseGrid(p.grid),
          name: p.name,
          desc: p.region,
          color: '#6b7280',
          icon: 'fas fa-circle',
          size: 10,
          category: 'places',
        });
      }
    }

    /* Tasks (grouped by area) */
    if (show('task')) {
      const taskCounts: Record<string, string[]> = {};
      for (const t of (mapData as any).tasks || []) {
        if (!taskCounts[t.area]) taskCounts[t.area] = [];
        taskCounts[t.area].push(...t.names);
      }
      for (const poi of mapData.majorPOIs) {
        const areaKey = poi.name.toLowerCase();
        const entry = Object.entries(taskCounts).find(([k]) =>
          k.toLowerCase().includes(areaKey) || areaKey.includes(k.toLowerCase())
        );
        if (entry && entry[1].length > 0) {
          result.push({
            pos: parseGrid(poi.grid),
            name: `${entry[1].length} tasks`,
            desc: `${poi.name}: ${entry[1].slice(0, 6).join(', ')}${entry[1].length > 6 ? '…' : ''}`,
            color: COLORS.task,
            icon: 'fas fa-clipboard-list',
            size: 18,
            category: 'task',
          });
        }
      }
    }

    // Deduplicate overlapping positions
    const seen = new Set<string>();
    return result.filter((m) => {
      const k = `${m.pos[0]},${m.pos[1]}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [filter]);

  /* Search-filtered markers */
  const filteredMarkers = useMemo(() => {
    if (!searchQuery.trim()) return markers;
    const q = searchQuery.toLowerCase();
    return markers.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.desc && m.desc.toLowerCase().includes(q))
    );
  }, [markers, searchQuery]);

  /* Counts per category */
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of markers) {
      c[m.category] = (c[m.category] || 0) + 1;
    }
    c['all'] = markers.length;
    return c;
  }, [markers]);

  /* Groups for sidebar rendering */
  const groups = useMemo(() => {
    const g: { group: string; cats: FilterCategory[] }[] = [];
    for (const cat of CATEGORIES) {
      if (cat.key === 'all') continue;
      const existing = g.find(x => x.group === cat.group);
      if (existing) existing.cats.push(cat);
      else g.push({ group: cat.group, cats: [cat] });
    }
    return g;
  }, []);

  /* ── Render ── */
  return (
    <div className="map-layout" ref={mapContainerRef}>
      {/* ── Sidebar ── */}
      <aside className="map-sidebar">
        <div className="map-sidebar-header">
          <i className="fas fa-layer-group text-[10px] text-accent" />
          <span>Layers</span>
        </div>

        {/* Search */}
        <div className="map-search-wrap">
          <i className="fas fa-search map-search-icon" />
          <input
            type="text"
            className="map-search-input"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="map-search-clear" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {/* Show All / Hide All */}
        <div className="map-bulk-toggle">
          <button onClick={() => setFilter('all')} className={`map-bulk-btn ${filter === 'all' ? 'active' : ''}`}>
            <i className="fas fa-eye" /> SHOW ALL
          </button>
          <button onClick={() => setFilter('__none__')} className={`map-bulk-btn ${filter === '__none__' ? 'active' : ''}`}>
            <i className="fas fa-eye-slash" /> HIDE ALL
          </button>
        </div>

        {/* Category groups */}
        <nav className="map-sidebar-nav">
          {groups.map((g) => (
            <div key={g.group} className="map-group">
              <div className="map-group-label">{GROUP_LABELS[g.group] || g.group}</div>
              {g.cats.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  className={`map-filter-btn ${filter === cat.key ? 'active' : ''}`}
                >
                  <span className="map-filter-dot" style={{ background: cat.color }} />
                  <i className={cat.icon} style={{ color: cat.color }} />
                  <span className="map-filter-label">{cat.label}</span>
                  <span className="map-filter-count">{counts[cat.key] || 0}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="map-sidebar-footer">
          <label className="map-toggle-row">
            <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} className="map-toggle-checkbox" />
            <span className="map-toggle-track">
              <span className={`map-toggle-thumb ${showGrid ? 'on' : ''}`} />
            </span>
            <span className="map-toggle-label">Grid</span>
          </label>
        </div>
      </aside>

      {/* ── Map canvas ── */}
      <div className="map-canvas">
        <MapContainer
          center={[MAP_H / 2, MAP_W / 2]}
          zoom={0}
          maxZoom={8}
          minZoom={-1}
          maxBounds={[[-5, -5], [MAP_H + 5, MAP_W + 5]]}
          style={{ width: '100%', height: '100%' }}
          crs={L.CRS.Simple}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          attributionControl={false}
        >
          <FitBounds />
          <ImageOverlay url={mapData.mapImage} bounds={[[0, 0], [MAP_H, MAP_W]]} />
          {showGrid && <GridOverlay />}
          {showGrid && <GridLabels />}
          <MouseTracker onMove={setCursorGrid} onZoom={setZoom} />

          {/* Markers */}
          <MarkerClusterGroup
            chunkedLoading={true}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            disableClusteringAtZoom={5}
          >
            {filteredMarkers.map((m, i) => (
              <Marker key={i} position={m.pos} icon={createIcon(m.color, m.size, m.icon, m.label, m.showName)}>
              <Popup>
                <div className="map-popup">
                  <div className="map-popup-header">
                    <i className={m.icon} style={{ color: m.color }} />
                    <span>{m.name}</span>
                  </div>
                  {m.desc && <div className="map-popup-desc">{m.desc}</div>}
                  <div className="map-popup-grid">
                    Grid: {Math.round((m.pos[1] / MAP_W) * DATA_RANGE_X + GRID_MIN_X)}:{Math.round((m.pos[0] / MAP_H) * DATA_RANGE_Y + GRID_MIN_Y)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* ── Overlay UI ── */}
        {/* Bottom bar */}
        <div className="map-bottom-bar">
          <div className="map-bottom-left">
            {cursorGrid ? (
              <span className="map-coords-display">
                <i className="fas fa-grid-2 text-[9px]" />
                Grid <b>{cursorGrid[0]}:{cursorGrid[1]}</b>
              </span>
            ) : (
              <span className="map-coords-display opacity-40">
                <i className="fas fa-grid-2 text-[9px]" />
                Grid —:—
              </span>
            )}
            <span className="map-zoom-display">
              <i className="fas fa-magnifying-glass text-[9px]" />
              Zoom {zoom}
            </span>
            {searchQuery && filteredMarkers.length < markers.length && (
              <span className="map-search-result">
                {filteredMarkers.length} / {markers.length} found
              </span>
            )}
          </div>
          <div className="map-bottom-right">
            <button onClick={toggleFullscreen} className={`map-btn-icon ${isFullscreen ? 'active' : ''}`} title="Toggle Fullscreen">
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
            </button>
          </div>
        </div>

        {/* Custom zoom controls */}
        <div className="map-zoom-ctrl">
          <button
            className="map-zoom-btn"
            onClick={() => { (document.querySelector('.leaflet-container') as any)?._leaflet_map?.zoomIn(); }}
            title="Zoom In"
          ><i className="fas fa-plus" /></button>
          <div className="map-zoom-level">{zoom}</div>
          <button
            className="map-zoom-btn"
            onClick={() => { (document.querySelector('.leaflet-container') as any)?._leaflet_map?.zoomOut(); }}
            title="Zoom Out"
          ><i className="fas fa-minus" /></button>
          <button
            className="map-zoom-btn map-fit-btn"
            onClick={() => { (document.querySelector('.leaflet-container') as any)?._leaflet_map?.fitBounds([[0, 0], [MAP_H, MAP_W]]); }}
            title="Fit Map"
          ><i className="fas fa-expand" /></button>
        </div>
      </div>
    </div>
  );
}
