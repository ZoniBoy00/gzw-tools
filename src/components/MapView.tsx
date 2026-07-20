import { useState, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapData from '../data/map_data.json';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const GRID_MIN_X = 90;
const GRID_MAX_X = 230;
const GRID_MIN_Y = 90;
const GRID_MAX_Y = 190;
const MAP_WIDTH = GRID_MAX_X - GRID_MIN_X;
const MAP_HEIGHT = GRID_MAX_Y - GRID_MIN_Y;

function parseGrid(g: string): [number, number] {
  const [x, y] = g.replace(/\s/g, '').split(':').map(Number);
  return [GRID_MAX_Y - y, x - GRID_MIN_X];
}

const COLORS = {
  town: '#e8b830',
  city: '#f59e0b',
  poi: '#3b82f6',
  cop_major: '#a855f7',
  cop_minor: '#8b5cf6',
  lz: '#22c55e',
  key: '#ef4444',
  task: '#f97316',
};

function createIcon(color: string, label?: string) {
  const size = label ? 28 : 16;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;color:#fff;">
        ${label || ''}
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  });
}

const FILTERS = [
  { key: 'all', label: 'All', icon: 'fas fa-map' },
  { key: 'town', label: 'Towns', icon: 'fas fa-city' },
  { key: 'poi', label: 'POIs', icon: 'fas fa-location-dot' },
  { key: 'cop', label: 'COPs', icon: 'fas fa-helmet-battle' },
  { key: 'lz', label: 'LZs', icon: 'fas fa-helicopter' },
  { key: 'key', label: 'Keys', icon: 'fas fa-key' },
  { key: 'task', label: 'Tasks', icon: 'fas fa-clipboard-list' },
];

function FitBounds() {
  const map = useMap();
  useMemo(() => {
    map.fitBounds([[0, 0], [MAP_HEIGHT, MAP_WIDTH]]);
  }, [map]);
  return null;
}

export default function MapView() {
  const [filter, setFilter] = useState('all');

  const markers = useMemo(() => {
    const result: { pos: [number, number]; name: string; color: string; desc?: string; icon: string; size?: number }[] = [];

    const show = (f: string) => filter === 'all' || filter === f;

    if (show('town') || show('poi')) {
      for (const poi of mapData.majorPOIs) {
        result.push({
          pos: parseGrid(poi.grid),
          name: poi.name,
          color: COLORS[poi.type as keyof typeof COLORS] || COLORS.poi,
          desc: poi.desc,
          icon: poi.type === 'city' ? 'fas fa-building' : poi.type === 'town' ? 'fas fa-city' : 'fas fa-location-dot',
        });
      }
    }

    if (show('cop')) {
      for (const cop of mapData.majorCOPs || []) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          color: COLORS.cop_major,
          desc: 'Major Combat Outpost',
          icon: 'fas fa-helmet-battle',
        });
      }
      for (const cop of mapData.minorCOPs || []) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          color: COLORS.cop_minor,
          desc: `Minor COP (${cop.region})`,
          icon: 'fas fa-shield-halved',
        });
      }
    }

    if (show('lz')) {
      for (const lz of (mapData as any).landingZones || []) {
        result.push({
          pos: parseGrid(lz.grid),
          name: lz.name,
          color: COLORS.lz,
          desc: `Landing Zone (${lz.region})`,
          icon: 'fas fa-helicopter',
        });
      }
    }

    if (show('key')) {
      for (const k of (mapData as any).keyLocations || []) {
        result.push({
          pos: parseGrid(k.grid),
          name: k.name,
          color: COLORS.key,
          desc: `Key (${k.region})`,
          icon: 'fas fa-key',
        });
      }
    }

    if (show('task')) {
      const taskCounts: Record<string, string[]> = {};
      for (const t of (mapData as any).tasks || []) {
        if (!taskCounts[t.area]) taskCounts[t.area] = [];
        taskCounts[t.area].push(...t.names);
      }
      for (const poi of mapData.majorPOIs) {
        const areaKey = poi.name.toLowerCase();
        const tasks = Object.entries(taskCounts).find(([k]) => k.toLowerCase().includes(areaKey));
        if (tasks && tasks[1].length > 0) {
          result.push({
            pos: parseGrid(poi.grid),
            name: `${tasks[1].length} tasks`,
            color: COLORS.task,
            desc: `${poi.name}: ${tasks[1].slice(0, 5).join(', ')}${tasks[1].length > 5 ? '...' : ''}`,
            icon: 'fas fa-clipboard-list',
          });
        }
      }
    }

    return result;
  }, [filter]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-map text-accent text-sm" />
        <span className="section-title">Interactive Map</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip ${filter === f.key ? 'active' : ''}`}
          >
            <i className={`${f.icon} text-[10px]`} />
            {f.label}
          </button>
        ))}
      </div>

      <div className="border border-border overflow-hidden rounded" style={{ height: 'calc(100vh - 310px)', minHeight: 400 }}>
        <MapContainer
          center={[MAP_HEIGHT / 2, MAP_WIDTH / 2]}
          zoom={0}
          style={{ width: '100%', height: '100%' }}
          crs={L.CRS.Simple}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
        >
          <FitBounds />
          <ImageOverlay
            url={mapData.mapImage}
            bounds={[[0, 0], [MAP_HEIGHT, MAP_WIDTH]]}
          />
          {markers.filter((m, i, a) => a.findIndex(x => x.pos[0] === m.pos[0] && x.pos[1] === m.pos[1]) === i).map((m, i) => (
            <Marker key={i} position={m.pos} icon={createIcon(m.color, m.name.length < 4 ? m.name : undefined)}>
              <Popup>
                <div className="text-xs font-mono">
                  <div className="flex items-center gap-1.5 mb-1">
                    <i className={m.icon} style={{ color: m.color }} />
                    <span className="font-bold text-white">{m.name}</span>
                  </div>
                  {m.desc && <div className="text-text-muted text-[10px]">{m.desc}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-text-muted">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.town }} /> Town</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.poi }} /> POI</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.cop_major }} /> Major COP</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.cop_minor }} /> Minor COP</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.lz }} /> LZ</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.key }} /> Key</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.task }} /> Tasks</span>
      </div>
    </div>
  );
}
