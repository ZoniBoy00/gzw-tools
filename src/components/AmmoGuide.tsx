import { useState, useMemo } from 'react';
import { AMMO, CALIBERS } from '../data/ammo';
import { ARMOR_CLASSES } from '../data/types';

const PEN: Record<number, { label: string; cls: string }> = {
  0: { label: '✕', cls: 'text-red-400 bg-red-900/20' },
  1: { label: '~', cls: 'text-amber-400 bg-amber-900/20' },
  2: { label: '•', cls: 'text-green-400 bg-green-900/20' },
};

export default function AmmoGuide() {
  const [caliber, setCaliber] = useState('5.56x45mm');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const byCal = AMMO.filter((a) => a.caliber === caliber);
    if (!search.trim()) return byCal;
    const q = search.toLowerCase();
    return byCal.filter((a) => a.name.toLowerCase().includes(q));
  }, [caliber, search]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-bolt text-accent text-sm" />
        <span className="section-title">Ammunition Penetration Chart</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ammo..."
          className="input flex-1 min-w-[120px]"
        />
        <select value={caliber} onChange={(e) => setCaliber(e.target.value)} className="input w-auto">
          {CALIBERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th className="text-right">m/s</th><th className="text-right">Acc</th><th className="text-right">Dur</th>
              <th className="text-center" title="Subsonic"><i className="fas fa-ear-deaf text-xs" /></th>
              <th className="text-center" title="Tracer"><i className="fas fa-fire text-xs" /></th>
              {ARMOR_CLASSES.map((ac) => <th key={ac} className="text-center">{ac}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td className="font-medium">
                  {r.name}
                  <span className="text-[10px] text-text-muted ml-1.5 font-normal">
                    {r.vendor ? `${r.vendor} R.${r.repLevel}` : r.source}
                  </span>
                </td>
                <td className="text-right text-text-muted">{r.speed}</td>
                <td className={`text-right ${r.accMod > 0 ? 'text-green' : r.accMod < 0 ? 'text-red' : 'text-text-muted'}`}>
                  {r.accMod > 0 ? `+${r.accMod}` : r.accMod || '0'}
                </td>
                <td className={`text-right ${r.durMod < 0 ? 'text-red' : 'text-text-muted'}`}>{r.durMod || '-'}</td>
                <td className="text-center text-text-muted">{r.subsonic ? <i className="fas fa-ear-deaf text-green/60" /> : '-'}</td>
                <td className="text-center text-text-muted">{r.tracer ? <i className="fas fa-fire text-accent/60" /> : '-'}</td>
                {ARMOR_CLASSES.map((ac) => {
                  const p = PEN[r.pen[ac] ?? 0];
                  return <td key={ac} className={`text-center text-xs ${p.cls}`}>{p.label}</td>;
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={14} className="text-center py-8 text-text-muted">No ammo found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-mono text-text-muted">
        {Object.entries(PEN).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 ${v.cls}`} /> {v.label} = {['Pointless', 'Magdump only', 'Usually ignores'][+k]}
          </span>
        ))}
        <span className="flex items-center gap-1"><i className="fas fa-ear-deaf text-green/60" /> Subsonic</span>
        <span className="flex items-center gap-1"><i className="fas fa-fire text-accent/60" /> Tracer</span>
      </div>
    </div>
  );
}
