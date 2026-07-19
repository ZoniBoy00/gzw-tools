import { useState, useMemo } from 'react';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons';

export default function WeaponsGuide() {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-crosshairs text-accent text-sm" />
        <span className="section-title">Weapons Database</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search weapon or caliber..." className="input flex-1 min-w-[120px]" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="input w-auto">
          <option value="All">All Types</option>
          {WEAPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        {filtered.map((w, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-border hover:border-border-light transition-colors">
            <div>
              <div className="text-sm font-medium">{w.name}</div>
              <div className="text-[11px] text-text-muted font-mono">{w.type}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-accent">{w.caliber}</div>
              <div className="text-[11px] text-text-muted font-mono">
                {w.magSize} rds{w.fireRate ? ` · ${w.fireRate} RPM` : ''} · {w.source}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-8 text-text-muted">No weapons found</div>}
      </div>

      <div className="mt-3 text-[11px] text-text-muted/60 font-mono">{WEAPONS.length} weapons total</div>
    </div>
  );
}
