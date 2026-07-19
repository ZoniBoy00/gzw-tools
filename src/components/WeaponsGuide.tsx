import { useState, useMemo, useEffect } from 'react';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons';

export default function WeaponsGuide() {
  const [type, setType] = useState(() => new URLSearchParams(window.location.search).get('wtype') || 'All');
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('wsearch') || '');

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (type !== 'All') p.set('wtype', type);
    if (search) p.set('wsearch', search);
    const qs = p.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [type, search]);

  const filtered = useMemo(() => {
    let data = WEAPONS;
    if (type !== 'All') data = data.filter((w) => w.type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((w) => w.name.toLowerCase().includes(q) || w.caliber.toLowerCase().includes(q));
    }
    return data;
  }, [type, search]);

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-crosshairs text-accent text-sm" />
        <span className="section-title">Weapons Database</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search weapon or caliber..."
          className="input flex-1 min-w-[120px]"
          aria-label="Search weapons"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input w-auto"
          aria-label="Filter by weapon type"
        >
          <option value="All">All Types</option>
          {WEAPON_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Mobile: cards; Desktop: list */}
      <div className="hidden sm:block">
        <div className="table-wrap">
          <table role="table" aria-label="Weapons database">
            <thead>
              <tr>
                <th role="columnheader">Name</th>
                <th role="columnheader">Type</th>
                <th role="columnheader">Caliber</th>
                <th className="text-center" role="columnheader">Mag</th>
                <th className="text-center" role="columnheader">RPM</th>
                <th className="text-right" role="columnheader">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => (
                <tr key={i}>
                  <td className="font-medium">{w.name}</td>
                  <td className="text-text-muted">{w.type}</td>
                  <td className="text-accent">{w.caliber}</td>
                  <td className="text-center text-text-muted">{w.magSize}</td>
                  <td className="text-center text-text-muted">{w.fireRate || '-'}</td>
                  <td className="text-right text-text-muted text-[10px]">{w.source}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <i className="fas fa-crosshairs" aria-hidden="true" />
                    <p>No weapons match your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-1.5">
        {filtered.map((w, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border border-border hover:border-border-light transition-colors"
          >
            <div>
              <div className="text-sm font-medium">{w.name}</div>
              <div className="text-[10px] text-text-muted font-mono">{w.type}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-accent">{w.caliber}</div>
              <div className="text-[10px] text-text-muted font-mono">
                {w.magSize} rds{w.fireRate ? ` · ${w.fireRate} RPM` : ''}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-crosshairs" aria-hidden="true" />
            <p>No weapons match your search</p>
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {WEAPONS.length} weapons
      </div>
    </div>
  );
}
