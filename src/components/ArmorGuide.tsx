import { useState, useMemo } from 'react';
import { VESTS, HELMETS, RECOMMENDATIONS, MATERIAL_RANK } from '../data/armor';
import TabBar from './ui/TabBar';
import itemImages from '../data/item_images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type SubTab = 'recommend' | 'vests' | 'helmets' | 'vendors';
const SUB: { id: SubTab; label: string; icon?: string }[] = [
  { id: 'recommend', label: 'Recommendations', icon: 'fas fa-star' },
  { id: 'vests', label: 'Vests', icon: 'fas fa-vest' },
  { id: 'helmets', label: 'Helmets', icon: 'fas fa-hard-hat' },
  { id: 'vendors', label: 'Vendor Gear', icon: 'fas fa-store' },
];

export default function ArmorGuide() {
  const [tab, setTab] = useState<SubTab>('recommend');

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-shield-halved text-accent text-sm" />
        <span className="section-title">Armor & Gear Guide</span>
      </div>

      <TabBar tabs={SUB} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'recommend' && <Recommendations />}
        {tab === 'vests' && <VestSection />}
        {tab === 'helmets' && <HelmetSection />}
        {tab === 'vendors' && <VendorTable />}
      </div>

      <Legend />
    </div>
  );
}

function Recommendations() {
  return (
    <div className="space-y-2 animate-stagger">
      {RECOMMENDATIONS.map((rec, i) => (
        <div key={i} className="border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="tag tag-amber">{rec.tier}</span>
            <span className="text-sm font-bold tracking-wide">{rec.label}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-surface-2 p-2 border border-border">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <i className="fas fa-vest text-accent/60" /> Vest
              </div>
              {rec.vest}
            </div>
            <div className="bg-surface-2 p-2 border border-border">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <i className="fas fa-hard-hat text-accent/60" /> Helmet
              </div>
              {rec.helmet}
            </div>
            <div className="bg-surface-2 p-2 border border-border">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <i className="fas fa-bolt text-accent/60" /> Ammo
              </div>
              <span className="text-text-muted">{rec.ammo.join(', ')}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-text-muted/80 italic font-mono">— {rec.notes}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Vest compare ───

function VestSection() {
  const [compare, setCompare] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const sorted = useMemo(() => [...VESTS].sort((a, b) => nij(b.nij) - nij(a.nij)), []);

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev,
    );
  };

  const comparedVests = useMemo(() => VESTS.filter((v) => compare.includes(v.name)), [compare]);

  return (
    <div>
      {/* Compare section */}
      {comparedVests.length > 0 && (
        <div className="mb-4 p-3 border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent mb-2 flex items-center gap-2">
            <i className="fas fa-not-equal text-xs" />
            Compare Mode — {comparedVests.length} vest{comparedVests.length > 1 ? 's' : ''} selected
            <button
              onClick={() => setCompare([])}
              className="ml-auto text-[9px] font-mono text-text-muted hover:text-text"
            >
              Clear
            </button>
          </div>
          <div className="compare-grid">
            {comparedVests.map((v) => (
              <div key={v.name} className="compare-card selected">
                <div className="text-sm font-bold mb-2 text-accent">{v.name}</div>
                {[
                  { label: 'NIJ Class', value: v.nij, cls: nijColor(v.nij) },
                  { label: 'Material', value: v.material, cls: matColor(v.material) },
                  { label: 'Plates', value: v.plates },
                  { label: 'Grid', value: v.grid },
                  { label: 'Weight', value: `${v.weight} kg` },
                  { label: 'Source', value: v.source },
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

      <div className="table-wrap table-mobile-cards">
        <table role="table" aria-label="Armor vest comparison">
          <thead>
            <tr>
              <th className="w-8 text-center" role="columnheader"></th>
              <th role="columnheader">Name</th>
              <th className="text-center" role="columnheader">NIJ</th>
              <th className="text-center" role="columnheader">Mat</th>
              <th className="text-center" role="columnheader"><i className="fas fa-shield" aria-hidden="true" /><span className="sr-only">Plates</span></th>
              <th className="text-center" role="columnheader">Grid</th>
              <th className="text-right" role="columnheader">Wt</th>
              <th className="text-right" role="columnheader">Source</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, i) => (
              <tr key={i}>
                <td className="text-center">
                  <button
                    onClick={() => toggleCompare(v.name)}
                    className={`text-[10px] px-1 py-0.5 border ${
                      compare.includes(v.name)
                        ? 'border-accent/50 text-accent bg-accent/10'
                        : 'border-border text-text-muted hover:border-text-muted/30'
                    }`}
                    aria-label={`${compare.includes(v.name) ? 'Remove' : 'Add'} ${v.name}`}
                  >
                    <i className={`fas fa-${compare.includes(v.name) ? 'check' : 'plus'}`} />
                  </button>
                </td>
                <td data-label="" className="font-medium">
                  <button onClick={() => setModalItem({
                    name: v.name,
                    image: itemImages[v.name as keyof typeof itemImages] as string | undefined,
                    type: 'vest',
                    fields: [
                      { label: 'NIJ Class', value: v.nij, color: nijColor(v.nij) },
                      { label: 'Material', value: v.material, color: matColor(v.material) },
                      { label: 'Plates', value: v.plates },
                      { label: 'Grid', value: v.grid },
                      { label: 'Weight', value: `${v.weight} kg` },
                      { label: 'Source', value: v.source },
                    ],
                  })} className="flex items-center gap-2 text-left w-full hover:text-accent transition-colors">
                    {itemImages[v.name as keyof typeof itemImages] && (
                      <img src={itemImages[v.name as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0 bg-surface-2 border border-border" loading="lazy" />
                    )}
                    {v.name}
                  </button>
                </td>
                <td data-label="NIJ" className={`text-center font-bold ${nijColor(v.nij)}`}>{v.nij}</td>
                <td data-label="Mat" className={`text-center ${matColor(v.material)}`}>{v.material.slice(0, 4)}</td>
                <td data-label="Plates" className="text-center text-text-muted">{v.plates.replace(', ', '/')}</td>
                <td data-label="Grid" className="text-center text-text-muted">{v.grid}</td>
                <td data-label="Wt" className="text-right text-text-muted">{v.weight}kg</td>
                <td data-label="Source" className="text-right text-text-muted">{v.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

// ─── Helmet compare ───

function HelmetSection() {
  const [compare, setCompare] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const sorted = useMemo(() => [...HELMETS].sort((a, b) => nij(b.nij) - nij(a.nij)), []);

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev,
    );
  };

  const comparedHelmets = useMemo(() => HELMETS.filter((h) => compare.includes(h.name)), [compare]);

  return (
    <div>
      {/* Compare section */}
      {comparedHelmets.length > 0 && (
        <div className="mb-4 p-3 border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent mb-2 flex items-center gap-2">
            <i className="fas fa-not-equal text-xs" />
            Compare Mode — {comparedHelmets.length} helmet{comparedHelmets.length > 1 ? 's' : ''} selected
            <button
              onClick={() => setCompare([])}
              className="ml-auto text-[9px] font-mono text-text-muted hover:text-text"
            >
              Clear
            </button>
          </div>
          <div className="compare-grid">
            {comparedHelmets.map((h) => (
              <div key={h.name} className="compare-card selected">
                <div className="text-sm font-bold mb-2 text-accent">{h.name}</div>
                {[
                  { label: 'NIJ Class', value: h.nij, cls: nijColor(h.nij) },
                  { label: 'Material', value: h.material, cls: matColor(h.material) },
                  { label: 'Weight', value: `${h.weight} kg` },
                  { label: 'Source', value: h.source },
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

      <div className="table-wrap table-mobile-cards">
        <table role="table" aria-label="Helmet comparison">
          <thead>
            <tr>
              <th className="w-8 text-center" role="columnheader"></th>
              <th role="columnheader">Name</th>
              <th className="text-center" role="columnheader">NIJ</th>
              <th className="text-center" role="columnheader">Mat</th>
              <th className="text-right" role="columnheader">Wt</th>
              <th className="text-right" role="columnheader">Source</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => (
              <tr key={i}>
                <td className="text-center">
                  <button
                    onClick={() => toggleCompare(h.name)}
                    className={`text-[10px] px-1 py-0.5 border ${
                      compare.includes(h.name)
                        ? 'border-accent/50 text-accent bg-accent/10'
                        : 'border-border text-text-muted hover:border-text-muted/30'
                    }`}
                    aria-label={`${compare.includes(h.name) ? 'Remove' : 'Add'} ${h.name}`}
                  >
                    <i className={`fas fa-${compare.includes(h.name) ? 'check' : 'plus'}`} />
                  </button>
                </td>
                <td data-label="" className="font-medium">
                  <button onClick={() => setModalItem({
                    name: h.name,
                    image: itemImages[h.name as keyof typeof itemImages] as string | undefined,
                    type: 'helmet',
                    fields: [
                      { label: 'NIJ Class', value: h.nij, color: nijColor(h.nij) },
                      { label: 'Material', value: h.material, color: matColor(h.material) },
                      { label: 'Weight', value: `${h.weight} kg` },
                      { label: 'Source', value: h.source },
                    ],
                  })} className="flex items-center gap-2 text-left w-full hover:text-accent transition-colors">
                    {itemImages[h.name as keyof typeof itemImages] && (
                      <img src={itemImages[h.name as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0 bg-surface-2 border border-border" loading="lazy" />
                    )}
                    {h.name}
                  </button>
                </td>
                <td data-label="NIJ" className={`text-center font-bold ${nijColor(h.nij)}`}>{h.nij}</td>
                <td data-label="Mat" className={`text-center ${matColor(h.material)}`}>{h.material}</td>
                <td data-label="Wt" className="text-right text-text-muted">{h.weight}kg</td>
                <td data-label="Source" className="text-right text-text-muted">{h.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

function VendorTable() {
  return (
    <div className="table-wrap table-mobile-cards">
      <table role="table" aria-label="Vendor gear unlock table">
        <thead>
          <tr>
            <th role="columnheader">Vendor</th>
            <th className="text-center" role="columnheader">Rep</th>
            <th role="columnheader">Items Unlocked</th>
          </tr>
        </thead>
        <tbody>
          {[
            { vendor: 'Handshake', rep: 1, items: 'Commander IIIA, LVS Overt IIIA+' },
            { vendor: 'Handshake', rep: 2, items: 'Covert Woodland III, MICH helmet' },
            { vendor: 'Handshake', rep: 3, items: 'CZ 4M Hornet Green III+' },
            { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++' },
            { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA helmet' },
            { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA' },
            { vendor: 'Turncoat', rep: 3, items: '6B23-1 III+' },
            { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA helmet' },
          ].map((v, i) => (
            <tr key={i}>
              <td data-label="" className="font-medium">{v.vendor}</td>
              <td data-label="Rep" className="text-center"><span className="tag tag-drab">R.{v.rep}</span></td>
              <td data-label="Items" className="text-text-muted">{v.items}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 border border-border p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
        <i className="fas fa-circle-info text-accent/60" />
        NIJ Protection Levels
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-mono items-center mb-2">
        {['IIA', '→', 'IIIA', '→', 'IIIA+', '→', 'III', '→', 'III+', '→', 'III++'].map((s, i) =>
          s === '→' ? (
            <span key={i} className="text-text-muted/40">{s}</span>
          ) : (
            <span key={i} className={`font-bold ${nijColor(s)}`}>{s}</span>
          )
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-text-muted">
        {Object.entries(MATERIAL_RANK).map(([mat, info]) => (
          <span key={mat} className={info.color}>{mat} — {info.desc}</span>
        ))}
      </div>
    </div>
  );
}

function nij(n: string): number {
  return ['IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++'].indexOf(n);
}
function nijColor(n: string): string {
  return n.includes('++') ? 'text-red-400' : n.includes('+') ? 'text-amber-300' : n.startsWith('III') ? 'text-yellow-300' : 'text-blue-300';
}
function matColor(m: string): string {
  return MATERIAL_RANK[m]?.color || 'text-text-muted';
}
