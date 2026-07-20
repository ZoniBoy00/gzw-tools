import { useState, useMemo } from 'react';
import { VESTS, HELMETS, PLATE_CARRIERS, RECOMMENDATIONS, MATERIAL_RANK } from '../data/armor';
import TabBar from './ui/TabBar';
import itemImages from '../data/images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type SubTab = 'recommend' | 'vests' | 'plate_carriers' | 'helmets' | 'vendors';
const SUB: { id: SubTab; label: string; icon?: string }[] = [
  { id: 'recommend', label: 'Recommendations', icon: 'fas fa-star' },
  { id: 'vests', label: 'Vests', icon: 'fas fa-vest' },
  { id: 'plate_carriers', label: 'Plate Carriers', icon: 'fas fa-shield' },
  { id: 'helmets', label: 'Helmets', icon: 'fas fa-hard-hat' },
  { id: 'vendors', label: 'Vendor Gear', icon: 'fas fa-store' },
];

function nijValue(n: string): number {
  const map: Record<string, number> = { 'I': 1, 'IIA': 2, 'IIA+': 3, 'IIIA': 4, 'IIIA+': 5, 'III': 6, 'III+': 7, 'III++': 8, 'IV': 9 };
  return map[n] || 0;
}
function nijColor(n: string): string {
  const v = nijValue(n);
  if (v >= 8) return 'text-red';
  if (v >= 6) return 'text-amber-400';
  if (v >= 4) return 'text-accent';
  return 'text-green';
}
function matColor(m: string): string {
  return MATERIAL_RANK[m]?.color || 'text-text-muted';
}

const NIJ_LEVELS = ['I', 'IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++', 'IV'];
const MATERIALS = Object.keys(MATERIAL_RANK);

interface ArmorItem {
  name: string;
  nij: string;
  material: string;
  weight: number;
  source: string;
  plates?: string;
  grid?: string;
}

function itemModal(item: ArmorItem, type: 'vest' | 'helmet'): ModalItem {
  const fields: ModalItem['fields'] = [
    { label: 'NIJ Class', value: item.nij, color: nijColor(item.nij), desc: 'Protection rating' },
    { label: 'Material', value: item.material, color: matColor(item.material), desc: 'Armor material type' },
    { label: 'Weight', value: `${item.weight} kg`, desc: 'Carry weight' },
    { label: 'Source', value: item.source, desc: 'Where to obtain' },
  ];
  if (item.plates) fields.splice(2, 0, { label: 'Plates', value: item.plates, desc: 'Areas protected' });
  if (item.grid) fields.splice(3, 0, { label: 'Grid', value: item.grid, desc: 'Inventory size' });
  return {
    name: item.name,
    image: itemImages[item.name as keyof typeof itemImages] as string | undefined,
    type,
    fields,
  };
}

/* ── Reusable armor list (KeysGuide-style) ── */
function ArmorList({ items, type }: { items: ArmorItem[]; type: 'vest' | 'helmet' }) {
  const [search, setSearch] = useState('');
  const [nijFilter, setNijFilter] = useState('');
  const [matFilter, setMatFilter] = useState('');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = useMemo(() => {
    let data = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((v) => v.name.toLowerCase().includes(q) || v.source.toLowerCase().includes(q));
    }
    if (nijFilter) data = data.filter((v) => v.nij === nijFilter);
    if (matFilter) data = data.filter((v) => v.material === matFilter);
    return data;
  }, [items, search, nijFilter, matFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, ArmorItem[]> = {};
    for (const v of filtered) {
      const key = v.source || 'Unknown';
      if (!g[key]) g[key] = [];
      g[key].push(v);
    }
    return g;
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${type}s...`}
          className="input flex-1 min-w-[160px] input-sm" />
        <select value={nijFilter} onChange={(e) => setNijFilter(e.target.value)} className="input w-auto input-sm">
          <option value="">All NIJ</option>
          {NIJ_LEVELS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={matFilter} onChange={(e) => setMatFilter(e.target.value)} className="input w-auto input-sm">
          <option value="">All Materials</option>
          {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([source, arr]) => (
          <div key={source}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-tag text-accent/60 text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{source}</span>
              <span className="text-[9px] font-mono text-text-muted/50">{arr.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {arr.map((v, i) => (
                <button key={`${v.name}-${i}`} onClick={() => setModalItem(itemModal(v, type))}
                  className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent/30 transition-colors text-left w-full"
                >
                  {itemImages[v.name as keyof typeof itemImages] ? (
                    <img src={itemImages[v.name as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border shrink-0">
                      <i className={`fas ${type === 'vest' ? 'fa-vest' : 'fa-hard-hat'} text-text-muted/30 text-sm`} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{v.name}</div>
                    <div className="text-[9px] font-mono text-text-muted/70 truncate">{v.material} · {v.weight}kg</div>
                  </div>
                  <span className={`text-[10px] font-bold font-mono shrink-0 ${nijColor(v.nij)}`}>{v.nij}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><i className="fas fa-shield-halved" /><p>No items match your filters</p></div>
      )}

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" /> {filtered.length} / {items.length} {type}s
      </div>
      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

// ─── Legacy sections kept intact ───

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
        {tab === 'vests' && <ArmorList items={VESTS} type="vest" />}
        {tab === 'plate_carriers' && <ArmorList items={PLATE_CARRIERS} type="vest" />}
        {tab === 'helmets' && <ArmorList items={HELMETS} type="helmet" />}
        {tab === 'vendors' && <VendorTable />}
      </div>
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
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1"><i className="fas fa-vest text-accent/60" /> Vest</div>
              {rec.vest}
            </div>
            <div className="bg-surface-2 p-2 border border-border">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1"><i className="fas fa-hard-hat text-accent/60" /> Helmet</div>
              {rec.helmet}
            </div>
            <div className="bg-surface-2 p-2 border border-border">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1"><i className="fas fa-bolt text-accent/60" /> Ammo</div>
              <span className="text-text-muted">{rec.ammo.join(', ')}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-text-muted/80 italic font-mono">— {rec.notes}</p>
        </div>
      ))}
    </div>
  );
}

const VENDOR_GEAR = [
  { vendor: 'Handshake', rep: 1, items: 'Commander IIIA vest, LVS Overt IIIA+ vest, Specter IIIA PC, CGPC3 TQS IIIA PC, Modular Operator Carrier Gen II IIIA PC' },
  { vendor: 'Handshake', rep: 2, items: 'CZ VIP III vest, Covert Woodland III vest, LVS Tactical RG III vest, PASGT II+ helmet, Mich TC-2000 IIIA helmet, MICH LC IIIA helmet, Chest Rig 901 Elite 4 III PC, LCS Sentry III PC' },
  { vendor: 'Handshake', rep: 3, items: 'CZ 4M Hornet Green III+ vest, MICH TC-2002 IIIA helmet, BK-ACH IIIA helmet, BK-ACH-HC IIIA helmet, Recon PC III+ PC' },
  { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++ vest, EXFIL IIIA helmet, FAST MT IIIA helmet, AMP-1 TP LC IIIA+ helmet, Plate6 III++ PC, LBT-6094 G3v2 III++ PC' },
  { vendor: 'Gunny', rep: 1, items: '9x19mm FMJ/HP, 5.56x45mm FMJ' },
  { vendor: 'Gunny', rep: 2, items: '5.56x45mm M193/M855, 5.45x39mm FMJ, 7.62x39mm PS, 9x19mm Xtreme Pen' },
  { vendor: 'Gunny', rep: 3, items: '5.56x45mm M855A1, 5.45x39mm BP, 7.62x39mm BP, .300 AAC AP, 7.62x51mm M61, 9x19mm Libra Snail' },
  { vendor: 'Lab Rat', rep: 1, items: 'Basic Surgical Kit, Suture Kit, Small Blood Bag, Bandage, Splint' },
  { vendor: 'Lab Rat', rep: 2, items: 'EPO V2, ORI-12 V2, Meloxicam, Combat Tourniquet, Activated Charcoal' },
  { vendor: 'Lab Rat', rep: 3, items: 'Large Blood Bag, Fenethylline, Strychnine' },
  { vendor: 'Lab Rat', rep: 4, items: 'HpR 3-S, Combat Medic Pack' },
  { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SSh-68N I helmet, TYPE 66 I helmet, SSh-60 I helmet' },
  { vendor: 'Turncoat', rep: 1, items: '6B47 Ratnik II helmet' },
  { vendor: 'Turncoat', rep: 2, items: 'SK-S III vest, ATBV III vest, Pantsir 2.0 III PC' },
  { vendor: 'Turncoat', rep: 3, items: '6B23-1 Flora III+ vest, LSHZ 1+ IIIA helmet' },
  { vendor: 'Turncoat', rep: 4, items: 'Phantom Type 2 III++ PC' },
  { vendor: 'Banshee', rep: 2, items: 'FAST XP HC IIIA helmet (loot)' },
  { vendor: 'Vulture', rep: 1, items: 'Assorted loot-bought gear' },
];

function VendorTable() {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th className="text-center">Rank</th>
            <th>Unlocked Items</th>
          </tr>
        </thead>
        <tbody>
          {VENDOR_GEAR.map((vg, i) => (
            <tr key={i}>
              <td className="font-medium">{vg.vendor}</td>
              <td className="text-center"><span className="tag tag-amber text-[9px]">R.{vg.rep}</span></td>
              <td className="text-text-muted text-xs">{vg.items}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
