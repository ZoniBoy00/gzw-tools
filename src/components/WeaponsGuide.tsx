import { useState, useMemo, useEffect } from 'react';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons';

export default function WeaponsGuide() {
  const [type, setType] = useState(() => new URLSearchParams(window.location.search).get('wtype') || 'All');
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('wsearch') || '');
  const [compare, setCompare] = useState<string[]>([]);

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (type !== 'All') p.set('wtype', type);
    if (search) p.set('wsearch', search);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
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

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev,
    );
  };

  const comparedWeapons = useMemo(
    () => WEAPONS.filter((w) => compare.includes(w.name)),
    [compare],
  );

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

      {/* Compare section */}
      {comparedWeapons.length > 0 && (
        <div className="mb-4 p-3 border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent mb-2 flex items-center gap-2">
            <i className="fas fa-not-equal text-xs" />
            Compare Mode — {comparedWeapons.length} weapon{comparedWeapons.length > 1 ? 's' : ''} selected
            <button
              onClick={() => setCompare([])}
              className="ml-auto text-[9px] font-mono text-text-muted hover:text-text"
            >
              Clear
            </button>
          </div>
          <div className="compare-grid">
            {comparedWeapons.map((w) => (
              <div key={w.name} className="compare-card selected">
                <div className="text-sm font-bold mb-2 text-accent">{w.name}</div>
                {[
                  { label: 'Type', value: w.type },
                  { label: 'Caliber', value: w.caliber },
                  { label: 'Mag Size', value: `${w.magSize} rds` },
                  { label: 'Fire Rate', value: w.fireRate ? `${w.fireRate} RPM` : '-' },
                  { label: 'Source', value: w.source },
                ].map((f) => (
                  <div key={f.label} className="compare-field">
                    <span className="text-text-muted">{f.label}</span>
                    <span className="text-text">{f.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-1.5">
        {filtered.map((w, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 border transition-colors ${
              compare.includes(w.name) ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-border-light'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium">{w.name}</div>
              <div className="text-[10px] text-text-muted font-mono">{w.type}</div>
            </div>
            <div className="text-right mr-2">
              <div className="text-sm font-mono text-accent">{w.caliber}</div>
              <div className="text-[10px] text-text-muted font-mono">
                {w.magSize} rds{w.fireRate ? ` · ${w.fireRate} RPM` : ''}
              </div>
            </div>
            <button
              onClick={() => toggleCompare(w.name)}
              className={`text-[10px] px-1.5 py-1 border shrink-0 ${
                compare.includes(w.name)
                  ? 'border-accent/50 text-accent bg-accent/10'
                  : 'border-border text-text-muted'
              }`}
              aria-label={`${compare.includes(w.name) ? 'Remove' : 'Add'} ${w.name}`}
            >
              <i className={`fas fa-${compare.includes(w.name) ? 'check' : 'plus'}`} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-crosshairs" aria-hidden="true" />
            <p>No weapons match your search</p>
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <div className="table-wrap table-mobile-cards">
          <table role="table" aria-label="Weapons database">
            <thead>
              <tr>
                <th role="columnheader" className="w-8"></th>
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
                  <td className="text-center">
                    <button
                      onClick={() => toggleCompare(w.name)}
                      className={`text-[10px] px-1 py-0.5 border ${
                        compare.includes(w.name)
                          ? 'border-accent/50 text-accent bg-accent/10'
                          : 'border-border text-text-muted hover:border-text-muted/30'
                      }`}
                      aria-label={`${compare.includes(w.name) ? 'Remove' : 'Add'} ${w.name}`}
                    >
                      <i className={`fas fa-${compare.includes(w.name) ? 'check' : 'plus'}`} />
                    </button>
                  </td>
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
                  <td colSpan={7} className="empty-state">
                    <i className="fas fa-crosshairs" aria-hidden="true" />
                    <p>No weapons match your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {WEAPONS.length} weapons
        {comparedWeapons.length > 0 && (
          <span className="text-accent/60">· {comparedWeapons.length} selected</span>
        )}
      </div>
    </div>
  );
}
