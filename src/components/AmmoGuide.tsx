import { useState, useMemo, useEffect } from 'react';
import { AMMO, CALIBERS } from '../data/ammo';
import { ARMOR_CLASSES } from '../data/types';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';
import itemImages from '../data/item_images.json';

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

export default function AmmoGuide() {
  const [caliber, setCaliber] = useState(() => new URLSearchParams(window.location.search).get('caliber') || '5.56x45mm');
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('asearch') || '');
  const [compare, setCompare] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (caliber !== '5.56x45mm') p.set('caliber', caliber);
    if (search) p.set('asearch', search);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [caliber, search]);

  const filtered = useMemo(() => {
    const byCal = AMMO.filter((a) => a.caliber === caliber);
    if (!search.trim()) return byCal;
    const q = search.toLowerCase();
    return byCal.filter((a) => a.name.toLowerCase().includes(q));
  }, [caliber, search]);

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev,
    );
  };

  const comparedRounds = useMemo(
    () => AMMO.filter((a) => compare.includes(a.name)),
    [compare],
  );

  return (
    <div className="tab-content">
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
          aria-label="Search ammunition"
        />
        <select
          value={caliber}
          onChange={(e) => setCaliber(e.target.value)}
          className="input w-auto"
          aria-label="Filter by caliber"
        >
          {CALIBERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Compare section */}
      {comparedRounds.length > 0 && (
        <div className="mb-4 p-3 border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent mb-2 flex items-center gap-2">
            <i className="fas fa-not-equal text-xs" />
            Compare Mode — {comparedRounds.length} round{comparedRounds.length > 1 ? 's' : ''} selected
            <button
              onClick={() => setCompare([])}
              className="ml-auto text-[9px] font-mono text-text-muted hover:text-text"
            >
              Clear
            </button>
          </div>
          <div className="compare-grid">
            {comparedRounds.map((r) => (
              <div key={r.name} className="compare-card selected">
                <div className="text-sm font-bold mb-2 text-accent">{r.name}</div>
                {[
                  { label: 'Speed', value: `${r.speed} m/s` },
                  { label: 'Acc Mod', value: `${r.accMod > 0 ? '+' : ''}${r.accMod}`, cls: r.accMod > 0 ? 'pen-high' : r.accMod < 0 ? 'pen-low' : '' },
                  { label: 'Dur Mod', value: r.durMod ? `${r.durMod}` : '-', cls: r.durMod < 0 ? 'durability-bad' : '' },
                  { label: 'Tracer', value: r.tracer ? 'Yes' : 'No' },
                  { label: 'Subsonic', value: r.subsonic ? 'Yes' : 'No' },
                  { label: 'Source', value: r.vendor ? `${r.vendor} R.${r.repLevel}` : r.source || 'Looting' },
                ].map((f) => (
                  <div key={f.label} className="compare-field">
                    <span className="text-text-muted">{f.label}</span>
                    <span className={f.cls || 'text-text'}>{f.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="table-wrap table-mobile-cards">
        <table className="ammo-table" role="table" aria-label="Ammunition penetration data">
          <thead>
            <tr>
              <th role="columnheader">Name</th>
              <th className="text-right" role="columnheader">m/s</th>
              <th className="text-right" role="columnheader">Acc</th>
              <th className="text-right" role="columnheader">Dur</th>
              <th className="text-center" role="columnheader" title="Subsonic">
                <i className="fas fa-ear-deaf text-xs" aria-hidden="true" />
                <span className="sr-only">Subsonic</span>
              </th>
              <th className="text-center" role="columnheader" title="Tracer">
                <i className="fas fa-fire text-xs" aria-hidden="true" />
                <span className="sr-only">Tracer</span>
              </th>
              {ARMOR_CLASSES.map((ac) => (
                <th key={ac} className="text-center" role="columnheader">
                  {ac}
                </th>
              ))}
              <th className="text-center" role="columnheader">Compare</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td data-label="" className="font-medium">
                  <button onClick={() => setModalItem({
                    name: r.name,
                    type: 'weapon',
                    fields: [
                      { label: 'Caliber', value: r.caliber, desc: 'The diameter and case length of the ammunition cartridge' },
                      { label: 'Speed', value: `${r.speed} m/s`, desc: 'Muzzle velocity — higher velocity means flatter trajectory and less bullet drop over distance' },
                      { label: 'Acc Mod', value: `${r.accMod > 0 ? '+' : ''}${r.accMod}`, color: r.accMod > 0 ? 'pen-high' : r.accMod < 0 ? 'pen-low' : '', desc: 'Accuracy modifier — negative values reduce weapon accuracy, positive values improve it' },
                      { label: 'Dur Mod', value: r.durMod ? `${r.durMod}` : '-', color: r.durMod < -50 ? 'durability-bad' : r.durMod < 0 ? 'pen-low' : '', desc: 'Durability modifier — negative values increase weapon wear and degradation per shot' },
                      { label: 'Subsonic', value: r.subsonic ? 'Yes' : 'No', desc: 'Subsonic rounds travel below the speed of sound — they are quieter and do not appear on the enemy minimap when fired' },
                      { label: 'Tracer', value: r.tracer ? 'Yes' : 'No', desc: 'Tracer rounds leave a visible trail of light — helps with aiming but reveals your position' },
                      { label: 'Source', value: r.vendor ? `${r.vendor} R.${r.repLevel}` : r.source || 'Looting', desc: 'Where to obtain this ammunition — from a vendor at a specific rep level, or found by looting' },
                    ],
                  })} className="flex items-center gap-2 text-left w-full hover:text-accent transition-colors">
                    {itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] && (
                      <img src={itemImages[`${r.caliber} ${r.name}` as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0 bg-surface-2 border border-border" loading="lazy" />
                    )}
                    <div className="min-w-0">
                      <span>{r.name}</span>
                      <span className="text-[10px] text-text-muted font-normal block truncate">
                        {r.vendor ? `${r.vendor} R.${r.repLevel}` : r.source || 'Looting'}
                      </span>
                    </div>
                  </button>
                </td>
                <td data-label="Speed" className="text-right text-text-muted">{r.speed}</td>
                <td data-label="Acc" className={`text-right ${r.accMod > 0 ? 'pen-high' : r.accMod < 0 ? 'pen-low' : 'text-text-muted'}`}>
                  {r.accMod > 0 ? `+${r.accMod}` : r.accMod || '0'}
                </td>
                <td data-label="Dur" className={`text-right ${r.durMod < -50 ? 'durability-bad' : r.durMod < 0 ? 'pen-low' : 'text-text-muted'}`}>
                  {r.durMod || '-'}
                </td>
                <td data-label="Sub" className="text-center text-text-muted">
                  {r.subsonic ? <i className="fas fa-ear-deaf pen-high" aria-label="Subsonic" /> : '-'}
                </td>
                <td data-label="Tr" className="text-center text-text-muted">
                  {r.tracer ? <i className="fas fa-fire text-accent/60" aria-label="Tracer" /> : '-'}
                </td>
                {ARMOR_CLASSES.map((ac) => {
                  const p = PEN[r.pen[ac] ?? 0];
                  return (
                    <td
                      key={ac}
                      data-label={ac}
                      className={`text-center text-xs ${p.cls}`}
                      title={`${ac}: ${PEN_LABELS[r.pen[ac] ?? 0]}`}
                    >
                      {p.label}
                    </td>
                  );
                })}
                <td data-label="" className="text-center align-middle">
                  <button
                    onClick={() => toggleCompare(r.name)}
                    className={`inline-flex items-center justify-center w-5 h-5 text-[10px] border transition-colors ${
                      compare.includes(r.name)
                        ? 'border-accent/50 text-accent bg-accent/10'
                        : 'border-border text-text-muted hover:border-text-muted/30'
                    }`}
                    aria-label={`${compare.includes(r.name) ? 'Remove' : 'Add'} ${r.name} for comparison`}
                    title="Compare"
                  >
                    <i className={`fas fa-${compare.includes(r.name) ? 'check' : 'plus'}`} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="empty-state">
                  <i className="fas fa-bolt" aria-hidden="true" />
                  <p>No ammunition matches your search</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-mono text-text-muted">
        {Object.entries(PEN).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 inline-block ${v.cls}`} />
            {' '}{v.label} = {['Ineffective', 'Magdump', 'Penetrates'][+k]}
          </span>
        ))}
        <span className="flex items-center gap-1"><i className="fas fa-ear-deaf pen-high" /> Subsonic</span>
        <span className="flex items-center gap-1"><i className="fas fa-fire text-accent/60" /> Tracer</span>
        <span className="flex items-center gap-1"><i className="fas fa-check text-accent/60" /> Compare mode</span>
      </div>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
