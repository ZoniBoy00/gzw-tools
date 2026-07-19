import { useState } from 'react';
import { VESTS, HELMETS, RECOMMENDATIONS, MATERIAL_RANK, VENDOR_GEAR } from '../data/armor';
import TabBar from './ui/TabBar';

type SubTab = 'recommend' | 'vests' | 'helmets' | 'vendors';
const SUB: { id: SubTab; label: string }[] = [
  { id: 'recommend', label: 'Recommendations' },
  { id: 'vests', label: 'Vests' },
  { id: 'helmets', label: 'Helmets' },
  { id: 'vendors', label: 'Vendor Gear' },
];

export default function ArmorGuide() {
  const [tab, setTab] = useState<SubTab>('recommend');

  return (
    <div>
      <p className="text-sm text-slate/70 mb-4 leading-relaxed">
        Armor, helmets, and gear. NIJ levels: <span className="text-blue-400">IIIA</span> →{' '}
        <span className="text-amber-400">III</span> → <span className="text-red-400">III++</span> (best).
      </p>

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
    <div className="space-y-3">
      {RECOMMENDATIONS.map((rec, i) => (
        <div key={i} className="p-3 bg-carbon-light/30 rounded-lg border border-carbon-border/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-og-light/50 text-sand font-mono">{rec.tier}</span>
            <span className="text-sm font-semibold text-white">{rec.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><div className="text-slate/50 mb-0.5">Vest</div><div className="text-white font-mono text-[11px]">{rec.vest}</div></div>
            <div><div className="text-slate/50 mb-0.5">Helmet</div><div className="text-white font-mono text-[11px]">{rec.helmet}</div></div>
            <div><div className="text-slate/50 mb-0.5">Ammo</div><div className="text-slate/70 font-mono text-[11px]">{rec.ammo.join(', ')}</div></div>
          </div>
          <div className="mt-2 text-[11px] text-slate/50 italic">{rec.notes}</div>
        </div>
      ))}
    </div>
  );
}

function VestTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-carbon-border">
            <TH>Name</TH><TH center>NIJ</TH><TH center>Mat</TH><TH center>Plates</TH><TH center>Grid</TH><TH right>Wt</TH><TH right>Source</TH>
          </tr>
        </thead>
        <tbody>
          {[...VESTS].sort((a, b) => nij(b.nij) - nij(a.nij)).map((v, i) => (
            <tr key={i} className="border-b border-carbon-border/20 hover:bg-carbon-light/30">
              <td className="py-2 pr-2 text-white font-medium">{v.name}</td>
              <td className={`text-center py-2 px-1.5 font-bold ${nijColor(v.nij)}`}>{v.nij}</td>
              <td className={`text-center py-2 px-1.5 ${matColor(v.material)}`}>{v.material.slice(0, 4)}</td>
              <td className="text-center py-2 px-1.5 text-slate/60">{v.plates}</td>
              <td className="text-center py-2 px-1.5 text-slate/60">{v.grid}</td>
              <td className="text-right py-2 px-1.5 text-slate/60">{v.weight}kg</td>
              <td className="text-right py-2 px-1.5 text-slate/60">{v.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HelmetTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-carbon-border">
            <TH>Name</TH><TH center>NIJ</TH><TH center>Mat</TH><TH right>Wt</TH><TH right>Source</TH>
          </tr>
        </thead>
        <tbody>
          {[...HELMETS].sort((a, b) => nij(b.nij) - nij(a.nij)).map((h, i) => (
            <tr key={i} className="border-b border-carbon-border/20 hover:bg-carbon-light/30">
              <td className="py-2 pr-2 text-white font-medium">{h.name}</td>
              <td className={`text-center py-2 px-1.5 font-bold ${nijColor(h.nij)}`}>{h.nij}</td>
              <td className={`text-center py-2 px-1.5 ${matColor(h.material)}`}>{h.material}</td>
              <td className="text-right py-2 px-1.5 text-slate/60">{h.weight}kg</td>
              <td className="text-right py-2 px-1.5 text-slate/60">{h.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VendorTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-carbon-border">
            <TH>Vendor</TH><TH center>Rep</TH><TH>Items Unlocked</TH>
          </tr>
        </thead>
        <tbody>
          {[...VENDOR_GEAR].sort((a, b) => a.rep - b.rep).map((v, i) => (
            <tr key={i} className="border-b border-carbon-border/20 hover:bg-carbon-light/30">
              <td className="py-2 pr-2 text-white font-medium">{v.vendor}</td>
              <td className="text-center py-2 px-1.5">
                <span className="bg-drab/30 text-drab-light px-1.5 py-0.5 rounded text-[10px] font-bold">R.{v.rep}</span>
              </td>
              <td className="py-2 px-1.5 text-slate/60">{v.items}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 p-3 bg-carbon-light/30 rounded-lg border border-carbon-border/30">
      <div className="text-[11px] font-semibold text-slate/50 mb-2 font-mono">NIJ Protection (worst → best)</div>
      <div className="flex flex-wrap gap-2 text-[11px] font-mono items-center">
        {['IIA', '→', 'IIIA', '→', 'IIIA+', '→', 'III', '→', 'III+', '→', 'III++'].map((s, i) =>
          s === '→' ? <span key={i} className="text-slate/50">{s}</span>
            : <span key={i} className={`font-bold ${nijColor(s)}`}>{s}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-slate/50">
        {Object.entries(MATERIAL_RANK).map(([mat, info]) => (
          <span key={mat} className={info.color}>{mat} — {info.desc}</span>
        ))}
      </div>
    </div>
  );
}

function TH({ children, right, center, title }: { children: React.ReactNode; right?: boolean; center?: boolean; title?: string }) {
  const align = right ? 'text-right' : center ? 'text-center' : 'text-left';
  return <th className={`${align} py-2 px-1.5 text-slate/50 font-semibold`} title={title}>{children}</th>;
}

function nij(n: string): number {
  return ['IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++'].indexOf(n);
}

function nijColor(n: string): string {
  if (n.includes('++')) return 'text-red-400';
  if (n.includes('+')) return 'text-amber-300';
  if (n.startsWith('III')) return 'text-yellow-300';
  return 'text-blue-300';
}

function matColor(m: string): string {
  return MATERIAL_RANK[m]?.color || 'text-slate/60';
}
