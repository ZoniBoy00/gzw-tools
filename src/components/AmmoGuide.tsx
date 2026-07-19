import { useState, useMemo } from 'react';
import { CALIBERS, AMMO } from '../data/ammo';
import { ARMOR_CLASSES } from '../data/types';

const PEN: Record<number, { label: string; cls: string }> = {
  0: { label: '✕', cls: 'bg-red-900/60 text-red-300' },
  1: { label: '~', cls: 'bg-amber-900/60 text-amber-300' },
  2: { label: '✓', cls: 'bg-green-900/60 text-green-300' },
};

export default function AmmoGuide() {
  const [caliber, setCaliber] = useState('5.56x45mm');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const byCaliber = AMMO.filter((a) => a.caliber === caliber);
    if (!search.trim()) return byCaliber;
    const q = search.toLowerCase();
    return byCaliber.filter((a) => a.name.toLowerCase().includes(q));
  }, [caliber, search]);

  return (
    <div>
      <p className="text-sm text-slate/70 mb-4 leading-relaxed">
        Ammunition penetration chart. Ratings reflect effectiveness against each NIJ armor class.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ammo..."
          className="flex-1 min-w-[140px] bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate/50 focus:border-drab focus:outline-none transition-colors"
        />
        <select
          value={caliber}
          onChange={(e) => setCaliber(e.target.value)}
          className="bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-drab focus:outline-none transition-colors"
        >
          {CALIBERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-carbon-border">
              <TH>Name</TH>
              <TH right>m/s</TH>
              <TH right>Acc</TH>
              <TH right>Dur</TH>
              <TH center title="Subsonic">S</TH>
              <TH center title="Tracer">T</TH>
              {ARMOR_CLASSES.map((ac) => <TH key={ac} center>{ac}</TH>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((round, i) => (
              <tr key={i} className="border-b border-carbon-border/30 hover:bg-carbon-light/30 transition-colors">
                <td className="py-2 pr-3 text-white font-medium sticky left-0 bg-carbon-light/95">
                  {round.name}
                  <span className="text-[10px] text-slate/50 ml-1.5 font-normal">
                    {round.vendor ? `${round.vendor} R.${round.repLevel}` : round.source}
                  </span>
                </td>
                <td className="text-right py-2 px-2 text-slate/60">{round.speed}</td>
                <td className={`text-right py-2 px-2 ${accColor(round.accMod)}`}>{fmtAcc(round.accMod)}</td>
                <td className={`text-right py-2 px-2 ${round.durMod < 0 ? 'text-red-400' : 'text-slate/60'}`}>
                  {round.durMod || '-'}
                </td>
                <td className="text-center py-2 px-2 text-slate/60">{round.subsonic ? '🔇' : '-'}</td>
                <td className="text-center py-2 px-2 text-slate/60">{round.tracer ? '🔥' : '-'}</td>
                {ARMOR_CLASSES.map((ac) => {
                  const p = PEN[round.pen[ac] ?? 0];
                  return <td key={ac} className={`text-center py-2 px-1.5 rounded-sm ${p.cls}`}>{p.label}</td>;
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={14} className="text-center py-8 text-slate/50">No ammo found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate/50 font-mono">
        {Object.entries(PEN).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${v.cls}`} /> {v.label} = {['Pointless', 'Magdump only', 'Usually ignores'][+k]}
          </span>
        ))}
        <span>🔇 = Subsonic</span>
        <span>🔥 = Tracer</span>
      </div>
    </div>
  );
}

function TH({ children, right, center, title }: { children: React.ReactNode; right?: boolean; center?: boolean; title?: string }) {
  const align = right ? 'text-right' : center ? 'text-center' : 'text-left';
  return <th className={`${align} py-2 px-1.5 text-slate/50 font-semibold min-w-[28px]`} title={title}>{children}</th>;
}

function accColor(v: number): string {
  return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-slate/60';
}

function fmtAcc(v: number): string {
  return v > 0 ? `+${v}` : String(v || '0');
}
