import { useState } from 'react';
import { VESTS, HELMETS, RECOMMENDATIONS, MATERIAL_RANK } from '../data/armor';
import TabBar from './ui/TabBar';

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
        {tab === 'vests' && <VestTable />}
        {tab === 'helmets' && <HelmetTable />}
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
        <div key={i} className="border border-border p-4 card-pulse">
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

function VestTable() {
  return (
    <div className="table-wrap table-mobile-cards">
      <table role="table" aria-label="Armor vest comparison">
        <thead>
          <tr>
            <th role="columnheader">Name</th>
            <th className="text-center" role="columnheader">NIJ</th>
            <th className="text-center" role="columnheader">Mat</th>
            <th className="text-center" role="columnheader"><i className="fas fa-shield" aria-hidden="true" /> <span className="sr-only">Plates</span></th>
            <th className="text-center" role="columnheader">Grid</th>
            <th className="text-right" role="columnheader">Wt</th>
            <th className="text-right" role="columnheader">Source</th>
          </tr>
        </thead>
        <tbody>
          {[...VESTS].sort((a, b) => nij(b.nij) - nij(a.nij)).map((v, i) => (
            <tr key={i}>
              <td data-label="" className="font-medium">{v.name}</td>
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
  );
}

function HelmetTable() {
  return (
    <div className="table-wrap table-mobile-cards">
      <table role="table" aria-label="Helmet comparison">
        <thead>
          <tr>
            <th role="columnheader">Name</th>
            <th className="text-center" role="columnheader">NIJ</th>
            <th className="text-center" role="columnheader">Mat</th>
            <th className="text-right" role="columnheader">Wt</th>
            <th className="text-right" role="columnheader">Source</th>
          </tr>
        </thead>
        <tbody>
          {[...HELMETS].sort((a, b) => nij(b.nij) - nij(a.nij)).map((h, i) => (
            <tr key={i}>
              <td data-label="" className="font-medium">{h.name}</td>
              <td data-label="NIJ" className={`text-center font-bold ${nijColor(h.nij)}`}>{h.nij}</td>
              <td data-label="Mat" className={`text-center ${matColor(h.material)}`}>{h.material}</td>
              <td data-label="Wt" className="text-right text-text-muted">{h.weight}kg</td>
              <td data-label="Source" className="text-right text-text-muted">{h.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
