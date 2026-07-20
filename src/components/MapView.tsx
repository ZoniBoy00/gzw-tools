import { useState, useMemo, useEffect } from 'react';
import {
  MapContainer, ImageOverlay, Marker, Popup, Polyline,
  useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapData from '../data/map_data.json';

/* ── Constants ── */
const GRID_MIN_X = 90;
const GRID_MAX_X = 230;
const GRID_MIN_Y = 90;
const GRID_MAX_Y = 190;
const MAP_W = GRID_MAX_X - GRID_MIN_X; // 140
const MAP_H = GRID_MAX_Y - GRID_MIN_Y; // 100

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

const CATEGORIES = [
  { key: 'all',   label: 'All',         icon: 'fas fa-map',         color: '#fff' },
  { key: 'town',  label: 'Towns',       icon: 'fas fa-city',        color: COLORS.town },
  { key: 'poi',   label: 'POIs',        icon: 'fas fa-location-dot', color: COLORS.poi },
  { key: 'cop',   label: 'COPs',        icon: 'fas fa-shield-halved', color: COLORS.cop_major },
  { key: 'lz',    label: 'LZ',          icon: 'fas fa-helicopter',   color: COLORS.lz },
  { key: 'key',   label: 'Keys',        icon: 'fas fa-key',         color: COLORS.key },
  { key: 'task',  label: 'Tasks',       icon: 'fas fa-clipboard-list', color: COLORS.task },
] as const;

/* ── Coordinate helpers ── */
function parseGrid(g: string): [number, number] {
  const [x, y] = g.replace(/\s/g, '').split(':').map(Number);
  return [GRID_MAX_Y - y, x - GRID_MIN_X]; // [leafletY, leafletX]
}

/* ── Marker icon factory ── */
function createIcon(color: string, size: number, icon?: string, label?: string) {
  const iconSize = Math.max(size, 18);
  const fontSize = icon ? Math.round(iconSize * 0.45) : Math.round(iconSize * 0.4);
  const borderW = Math.max(2, Math.round(iconSize * 0.1));
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${iconSize}px;height:${iconSize}px;">
      <div style="
        width:${iconSize}px;height:${iconSize}px;
        background:${color}22;
        border:${borderW}px solid ${color};
        border-radius:50%;
        box-shadow:0 0 12px ${color}44, 0 2px 8px rgba(0,0,0,0.6);
        display:flex;align-items:center;justify-content:center;
        font-size:${fontSize}px;font-weight:700;
        color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.8);
        transition:transform 0.15s;
      ">
        ${icon ? `<i class="${icon}" style="font-size:${fontSize}px"></i>`
          : label ? `<span style="font-size:${fontSize - 2}px;font-family:'Rajdhani','JetBrains Mono',monospace">${label}</span>` : ''}
      </div>
      ${label && icon
        ? `<span style="
            position:absolute;top:-6px;left:50%;transform:translateX(-50%);
            font-size:7px;font-weight:700;font-family:'Rajdhani',sans-serif;
            color:#fff;text-shadow:0 1px 6px rgba(0,0,0,0.9);
            white-space:nowrap;letter-spacing:0.5px;
            background:${color}88;padding:0 4px;border-radius:2px;
            backdrop-filter:blur(4px);
          ">${label}</span>`
        : ''}
    </div>`,
    iconSize: [iconSize + 6, iconSize + 6],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2 - 8],
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
  const lines: { from: [number, number]; to: [number, number]; label?: string }[] = [];

  // Vertical lines (gridX every 10)
  for (let gx = 100; gx <= 220; gx += 10) {
    const lx = gx - GRID_MIN_X;
    lines.push({ from: [0, lx], to: [MAP_H, lx], label: `${gx}` });
  }
  // Horizontal lines (gridY every 10)
  for (let gy = 100; gy <= 180; gy += 10) {
    const ly = GRID_MAX_Y - gy;
    lines.push({ from: [ly, 0], to: [ly, MAP_W], label: `${gy}` });
  }

  return (
    <>
      {lines.map((l, i) => (
        <Polyline
          key={i}
          positions={[l.from, l.to]}
          color="rgba(255,255,255,0.07)"
          weight={1}
          interactive={false}
        />
      ))}
    </>
  );
}

/* ── Grid labels on edges ── */
function GridLabels() {
  const labels: { pos: [number, number]; text: string }[] = [];

  // Top edge (X labels)
  for (let gx = 100; gx <= 220; gx += 10) {
    const lx = gx - GRID_MIN_X;
    labels.push({ pos: [MAP_H + 2, lx], text: `${gx}` });
  }
  // Left edge (Y labels)
  for (let gy = 100; gy <= 180; gy += 10) {
    const ly = GRID_MAX_Y - gy;
    labels.push({ pos: [ly, -2], text: `${gy}` });
  }

  return (
    <>
      {labels.map((l, i) => {
        const isX = i < 13; // top edge labels first
        const icon = L.divIcon({
          className: '',
          html: `<span style="
            font-size:8px;font-family:'JetBrains Mono',monospace;
            color:rgba(255,255,255,0.25);
            text-shadow:0 0 6px rgba(0,0,0,0.9);
            letter-spacing:0.5px;
          ">${l.text}</span>`,
          iconSize: [24, 10],
          iconAnchor: isX ? [12, 0] : [0, 5],
        });
        return <Marker key={i} position={l.pos} icon={icon} interactive={false} />;
      })}
    </>
  );
}

/* ── Mouse coordinate tracker ── */
function MouseTracker({ onMove, onZoom }: {
  onMove: (g: [number, number]) => void;
  onZoom: (z: number) => void;
}) {
  useMapEvents({
    mousemove: (e) => {
      const gx = Math.round(e.latlng.lng + GRID_MIN_X);
      const gy = Math.round(GRID_MAX_Y - e.latlng.lat);
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
  category: string;
}

/* ── MapView component ── */
export default function MapView() {
  const [filter, setFilter] = useState('all');
  const [showGrid, setShowGrid] = useState(true);
  const [cursorGrid, setCursorGrid] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(0);

  /* Build markers from map_data.json */
  const markers = useMemo(() => {
    const result: MarkerItem[] = [];
    const show = (f: string) => filter === 'all' || filter === f;

    /* Towns / cities / POIs */
    if (show('town') || show('poi') || show('all')) {
      for (const poi of mapData.majorPOIs) {
        const cat = poi.type === 'city' || poi.type === 'town' ? 'town' : 'poi';
        if (filter !== 'all' && cat !== filter) continue;
        const isMajor = poi.type === 'city';
        result.push({
          pos: parseGrid(poi.grid),
          name: poi.name,
          desc: poi.desc,
          color: COLORS[poi.type] || COLORS.poi,
          icon: poi.type === 'city' ? 'fas fa-building' : poi.type === 'town' ? 'fas fa-city' : 'fas fa-location-dot',
          size: isMajor ? 30 : 22,
          label: isMajor ? poi.name : undefined,
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
        result.push({
          pos: parseGrid(lz.grid),
          name: lz.name,
          desc: `Landing Zone (${lz.region})`,
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

    // Deduplicate overlapping positions (keep the first / larger one)
    const seen = new Set<string>();
    return result.filter((m) => {
      const k = `${m.pos[0]},${m.pos[1]}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [filter]);

  /* Counts per category */
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of markers) {
      c[m.category] = (c[m.category] || 0) + 1;
    }
    c['all'] = markers.length;
    return c;
  }, [markers]);

  /* ── Render ── */
  return (
    <div className="map-layout">
      {/* ── Sidebar ── */}
      <aside className="map-sidebar">
        <div className="map-sidebar-header">
          <i className="fas fa-layer-group text-[10px] text-accent" />
          <span>Layers</span>
        </div>

        <nav className="map-sidebar-nav">
          {CATEGORIES.map((cat) => (
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
        </nav>

        <div className="map-sidebar-footer">
          <label className="map-toggle-row">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => setShowGrid(!showGrid)}
              className="map-toggle-checkbox"
            />
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
          style={{ width: '100%', height: '100%' }}
          crs={L.CRS.Simple}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          attributionControl={false}
        >
          <FitBounds />
          <ImageOverlay
            url={mapData.mapImage}
            bounds={[[0, 0], [MAP_H, MAP_W]]}
          />
          {showGrid && <GridOverlay />}
          {showGrid && <GridLabels />}
          <MouseTracker onMove={setCursorGrid} onZoom={setZoom} />

          {/* Markers */}
          {markers.map((m, i) => (
            <Marker
              key={i}
              position={m.pos}
              icon={createIcon(m.color, m.size, m.icon, m.label)}
            >
              <Popup>
                <div className="map-popup">
                  <div className="map-popup-header">
                    <i className={m.icon} style={{ color: m.color }} />
                    <span>{m.name}</span>
                  </div>
                  {m.desc && <div className="map-popup-desc">{m.desc}</div>}
                  <div className="map-popup-grid">
                    Grid: {Math.round(m.pos[1] + GRID_MIN_X)}:{Math.round(GRID_MAX_Y - m.pos[0])}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
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
          </div>
          <div className="map-bottom-right">
            <button onClick={() => setShowGrid(!showGrid)} className={`map-btn-icon ${showGrid ? 'active' : ''}`} title="Toggle Grid">
              <i className="fas fa-border-all" />
            </button>
          </div>
        </div>

        {/* Custom zoom controls */}
        <div className="map-zoom-ctrl">
          <button
            className="map-zoom-btn"
            onClick={() => { const el = document.querySelector('.leaflet-container') as any; if (el?._leaflet_map) el._leaflet_map.zoomIn(); }}
            title="Zoom In"
          >
            <i className="fas fa-plus" />
          </button>
          <div className="map-zoom-level">{zoom}</div>
          <button
            className="map-zoom-btn"
            onClick={() => { const el = document.querySelector('.leaflet-container') as any; if (el?._leaflet_map) el._leaflet_map.zoomOut(); }}
            title="Zoom Out"
          >
            <i className="fas fa-minus" />
          </button>
          <button
            className="map-zoom-btn map-fit-btn"
            onClick={() => { const el = document.querySelector('.leaflet-container') as any; if (el?._leaflet_map) el._leaflet_map.fitBounds([[0, 0], [MAP_H, MAP_W]]); }}
            title="Fit Map"
          >
            <i className="fas fa-expand" />
          </button>
        </div>
      </div>
    </div>
  );
}
