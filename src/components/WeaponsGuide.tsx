import { useState, useMemo } from 'react';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons';

export default function WeaponsGuide() {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return WEAPONS.filter((w) => {
      if (type !== 'All' && w.type !== type) return false;
      if (search.trim()) return w.name.toLowerCase().includes(search.toLowerCase()) || w.caliber.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [type, search]);

  return (
    <div>
      <p className="text-sm text-slate/70 mb-4 leading-relaxed">
        Weapon database — calibers, magazine sizes, and where to find them.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search weapon or caliber..."
          className="flex-1 min-w-[140px] bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate/50 focus:border-drab focus:outline-none transition-colors"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-drab focus:outline-none transition-colors"
        >
          <option value="All">All Types</option>
          {WEAPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid gap-2">
        {filtered.map((w, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-carbon-light/30 rounded-lg border border-carbon-border/30 hover:bg-carbon-light/50 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white">{w.name}</div>
              <div className="text-[11px] text-slate/50 font-mono">{w.type}</div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-sm font-mono text-drab-light">{w.caliber}</div>
              <div className="text-[11px] text-slate/50 font-mono">{w.magSize} rds{w.fireRate ? ` · ${w.fireRate} RPM` : ''}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate/50">No weapons found</div>
        )}
      </div>

      <div className="mt-4 text-[11px] text-slate/40 font-mono">
        {WEAPONS.length} weapons · Data from GZW Wiki
      </div>
    </div>
  );
}
