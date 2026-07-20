import { useState, useMemo } from 'react';
import { AMMO, CALIBERS } from '../data/ammo';
import { ARMOR_CLASSES } from '../data/types';
import itemImages from '../data/images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

const PEN: Record<number, { label: string; cls: string }> = {
  0: { label: '✕', cls: 'pen-none' },
  1: { label: '~', cls: 'pen-low' },
  2: { label: '•', cls: 'pen-high' },
};

const PEN_LABELS: Record<number, string> = {
  0: 'Ineffective',
  1: 'Magdump',
  2: 'Penetrates',
};

function sourceKey(r: (typeof AMMO)[number]): string {
  if (r.vendor) return `${r.vendor} R.${r.repLevel}`;
  return r.source || 'Looting';
}

const ARMOR_SHORT: Record<string, string> = {
  'I': 'I', 'IIA': 'A', 'IIA+': 'A+', 'IIIA': '3A', 'IIIA+': '3A+',
  'III': '3', 'III+': '3+', 'III++': '3++', 'IV': '4',
};

export default function AmmoGuide() {
  const [caliber, setCaliber] = useState('5.56x45mm');
  const [search, setSearch] = useState('');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const byCaliber = useMemo(() => AMMO.filter((a) => a.caliber === caliber), [caliber]);

  const filtered = useMemo(() => {
    if (!search.trim()) return byCaliber;
    const q = search.toLowerCase();
    return byCaliber.filter((a) => a.name.toLowerCase().includes(q));
  }, [byCaliber, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof AMMO> = {};
    for (const r of filtered) {
      const key = sourceKey(r);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [filtered]);

  const openModal = (r: (typeof AMMO)[number]) => {
    const name = `${r.caliber} ${r.name}`;
    const imgKey = name as keyof typeof itemImages;
    setModalItem({
      name,
      image: itemImages[imgKey] as string | undefined,
      type: 'ammo',
      fields: [
        { label: 'Caliber', value: r.caliber, desc: 'The diameter and case length of the ammunition cartridge' },
        { label: 'Speed', value: `${r.speed} m/s`, desc: 'Muzzle velocity — higher velocity means flatter trajectory' },
        { label: 'Acc Mod', value: `${r.accMod > 0 ? '+' : ''}${r.accMod}`, color: r.accMod > 0 ? 'pen-high' : r.accMod < 0 ? 'pen-low' : '', desc: 'Accuracy modifier — negative values reduce weapon accuracy' },
        { label: 'Dur Mod', value: r.durMod ? `${r.durMod}` : '-', color: r.durMod < -50 ? 'durability-bad' : r.durMod < 0 ? 'pen-low' : '', desc: 'Durability modifier — negative values increase weapon wear' },
        { label: 'Subsonic', value: r.subsonic ? 'Yes' : 'No', desc: 'Subsonic rounds are quieter and do not appear on the enemy minimap' },
        { label: 'Tracer', value: r.tracer ? 'Yes' : 'No', desc: 'Tracer rounds leave a visible trail of light' },
        { label: 'Source', value: r.vendor ? `${r.vendor} R.${r.repLevel}` : r.source || 'Looting', desc: 'Where to obtain this ammunition' },
      ],
    });
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-bolt text-accent text-sm" />
        <span className="section-title">Ammunition Penetration Chart</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ammo..."
          className="input flex-1 min-w-[160px] input-sm"
          aria-label="Search ammunition"
        />
        <select value={caliber} onChange={(e) => setCaliber(e.target.value)} className="input w-auto input-sm" aria-label="Filter by caliber">
          {CALIBERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-bolt" aria-hidden="true" />
          <p>No ammunition matches your search</p>
        </div>
      )}

      {/* Grouped by source */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([source, rounds]) => (
          <div key={source}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-store text-accent/60 text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{source}</span>
              <span className="text-[9px] font-mono text-text-muted/50">{rounds.length} round{rounds.length > 1 ? 's' : ''}</span>
            </div>

            {/* Desktop: table */}
            <div className="table-wrap hidden sm:block">
              <table className="ammo-table" role="table" aria-label="Ammunition data">
                <thead>
                  <tr>
                    <th role="columnheader">Name</th>
                    <th className="text-right" role="columnheader">m/s</th>
                    <th className="text-right" role="columnheader">Acc</th>
                    <th className="text-right" role="columnheader">Dur</th>
                    <th className="text-center" role="columnheader" title="Subsonic"><i className="fas fa-ear-deaf text-xs" /><span className="sr-only">Sub</span></th>
                    <th className="text-center" role="columnheader" title="Tracer"><i className="fas fa-fire text-xs" /><span className="sr-only">Tr</span></th>
                    {ARMOR_CLASSES.map((ac) => (
                      <th key={ac} className="text-center" role="columnheader" title={ac}>{ARMOR_SHORT[ac] || ac}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((r, i) => (
                    <tr key={i} className="cursor-pointer hover:bg-accent/5" onClick={() => openModal(r)}>
                      <td data-label="" className="font-medium">
                        <div className="flex items-center gap-2">
                          {itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] && (
                            <img src={itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] as string} alt="" className="w-7 h-7 object-contain shrink-0 bg-surface-2 border border-border" loading="lazy" />
                          )}
                          <div className="min-w-0">
                            <span className="text-xs">{r.name}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Speed" className="text-right text-text-muted text-xs">{r.speed}</td>
                      <td data-label="Acc" className={`text-right text-xs ${r.accMod > 0 ? 'pen-high' : r.accMod < 0 ? 'pen-low' : 'text-text-muted'}`}>
                        {r.accMod > 0 ? `+${r.accMod}` : r.accMod || '0'}
                      </td>
                      <td data-label="Dur" className={`text-right text-xs ${r.durMod < -50 ? 'durability-bad' : r.durMod < 0 ? 'pen-low' : 'text-text-muted'}`}>
                        {r.durMod || '-'}
                      </td>
                      <td data-label="Sub" className="text-center text-xs text-text-muted">
                        {r.subsonic ? <i className="fas fa-ear-deaf pen-high" aria-label="Subsonic" /> : '-'}
                      </td>
                      <td data-label="Tr" className="text-center text-xs text-text-muted">
                        {r.tracer ? <i className="fas fa-fire text-accent/60" aria-label="Tracer" /> : '-'}
                      </td>
                      {ARMOR_CLASSES.map((ac) => {
                        const p = PEN[r.pen[ac] ?? 0];
                        return (
                          <td key={ac} data-label={ac} className={`text-center text-xs ${p.cls}`} title={`${ac}: ${PEN_LABELS[r.pen[ac] ?? 0]}`}>
                            {p.label}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: compact cards */}
            <div className="sm:hidden space-y-1">
              {rounds.map((r, i) => (
                <button key={i} onClick={() => openModal(r)}
                  className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent/30 transition-colors text-left w-full"
                >
                  {itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] ? (
                    <img src={itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border shrink-0">
                      <i className="fas fa-bolt text-text-muted/30 text-sm" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{r.name}</div>
                    <div className="text-[9px] font-mono text-text-muted/70">
                      {r.speed}m/s · acc {r.accMod > 0 ? '+' : ''}{r.accMod}
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {ARMOR_CLASSES.map((ac) => {
                      const p = PEN[r.pen[ac] ?? 0];
                      return (
                        <span key={ac} className={`w-2.5 h-2.5 ${p.cls} text-[6px] flex items-center justify-center`} title={`${ac}: ${PEN_LABELS[r.pen[ac] ?? 0]}`}>
                          {/* dot indicator */}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-mono text-text-muted">
        {Object.entries(PEN).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 inline-block ${v.cls}`} />{' '}{v.label} = {['Ineffective', 'Magdump', 'Penetrates'][+k]}
          </span>
        ))}
        <span className="flex items-center gap-1"><i className="fas fa-ear-deaf pen-high" /> Subsonic</span>
        <span className="flex items-center gap-1"><i className="fas fa-fire text-accent/60" /> Tracer</span>
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {byCaliber.length} rounds ({caliber})
      </div>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
