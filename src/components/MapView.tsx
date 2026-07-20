import { useState, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapData from '../data/map_data.json';

// Fix Leaflet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Grid bounds in game coordinates
const GRID_MIN_X = 90;
const GRID_MAX_X = 230;
const GRID_MIN_Y = 90;
const GRID_MAX_Y = 190;

const MAP_WIDTH = GRID_MAX_X - GRID_MIN_X;  // 140
const MAP_HEIGHT = GRID_MAX_Y - GRID_MIN_Y; // 100

function parseGrid(g: string): [number, number] {
  const [x, y] = g.split(':').map(Number);
  return [GRID_MAX_Y - y, x - GRID_MIN_X]; // Leaflet uses [lat, lng]
}

const TYPE_COLORS: Record<string, string> = {
  town: '#e8b830',
  city: '#f59e0b',
  poi: '#3b82f6',
  cop_major: '#a855f7',
  cop_minor: '#8b5cf6',
};

function createIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.6);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

const TYPE_ICONS: Record<string, string> = {
  town: 'fas fa-city',
  city: 'fas fa-building',
  poi: 'fas fa-location-dot',
  cop_major: 'fas fa-helmet-battle',
  cop_minor: 'fas fa-shield-halved',
};

const FILTERS = [
  { key: 'all', label: 'All', icon: 'fas fa-map' },
  { key: 'town', label: 'Towns', icon: 'fas fa-city' },
  { key: 'poi', label: 'POIs', icon: 'fas fa-location-dot' },
  { key: 'cop', label: 'COPs', icon: 'fas fa-helmet-battle' },
];

function FitBounds() {
  const map = useMap();
  useMemo(() => {
    map.fitBounds([
      [0, 0],
      [MAP_HEIGHT, MAP_WIDTH],
    ]);
  }, [map]);
  return null;
}

export default function MapView() {
  const [filter, setFilter] = useState('all');

  const markers = useMemo(() => {
    const result: { pos: [number, number]; name: string; type: string; color: string; desc?: string; icon: string }[] = [];

    if (filter === 'all' || filter === 'town' || filter === 'poi') {
      for (const poi of mapData.majorPOIs) {
        result.push({
          pos: parseGrid(poi.grid),
          name: poi.name,
          type: poi.type,
          color: TYPE_COLORS[poi.type],
          desc: poi.desc,
          icon: TYPE_ICONS[poi.type],
        });
      }
    }

    if (filter === 'all' || filter === 'cop') {
      for (const cop of mapData.majorCOPs) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          type: 'cop_major',
          color: TYPE_COLORS.cop_major,
          desc: 'Major Combat Outpost',
          icon: TYPE_ICONS.cop_major,
        });
      }
      for (const cop of mapData.minorCOPs) {
        result.push({
          pos: parseGrid(cop.grid),
          name: cop.name,
          type: 'cop_minor',
          color: TYPE_COLORS.cop_minor,
          desc: `Minor COP (${cop.region})`,
          icon: TYPE_ICONS.cop_minor,
        });
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

      {/* Filters */}
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

      {/* Map */}
      <div className="border border-border overflow-hidden rounded" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
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
          {markers.map((m, i) => (
            <Marker key={i} position={m.pos} icon={createIcon(m.color)}>
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
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS.town }} /> Town</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS.poi }} /> POI</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS.cop_major }} /> Major COP</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS.cop_minor }} /> Minor COP</span>
      </div>
    </div>
  );
}
