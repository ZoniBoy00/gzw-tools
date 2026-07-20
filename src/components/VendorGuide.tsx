import { useState, useMemo } from 'react';
import { VENDORS, formatNumber } from '../lib/calc';
import { getVendorReps, setVendorRep } from '../lib/vendortracker';
import { AMMO } from '../data/ammo';
import { WEAPONS } from '../data/weapons';
import { VESTS, HELMETS } from '../data/armor';
import itemImages from '../data/item_images.json';
import vendorImages from '../data/vendor_images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

interface VendorItem {
  name: string;
  type: 'weapon' | 'ammo' | 'vest' | 'helmet';
  repLevel: number;
  detail: string;
  image?: string;
  /** Full source reference (e.g. "Turncoat R.3") */
  source?: string;
  /** Vendor slug for building modal fields */
  vendorName?: string;
  /** Raw data ref for modal field generation */
  raw?: Record<string, unknown>;
}

function parseRepLevel(source: string): number {
  const m = source.match(/R\.(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function getVendorItems(vendorName: string): VendorItem[] {
  const items: VendorItem[] = [];

  for (const w of WEAPONS) {
    const rl = parseRepLevel(w.source);
    if (rl > 0 && w.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({
        name: w.name, type: 'weapon', repLevel: rl,
        detail: `${w.type} · ${w.caliber} · ${w.magSize}rds${w.fireRate ? ` · ${w.fireRate}RPM` : ''}`,
        source: w.source,
        vendorName: vendorName,
        raw: w as unknown as Record<string, unknown>,
      });
    }
  }
  for (const a of AMMO) {
    if (a.vendor?.toLowerCase() === vendorName.toLowerCase() && a.repLevel) {
      items.push({
        name: a.name, type: 'ammo', repLevel: a.repLevel,
        detail: `${a.caliber} · ${a.speed}m/s`,
        source: `${a.vendor} R.${a.repLevel}`,
        vendorName: vendorName,
        raw: a as unknown as Record<string, unknown>,
      });
    }
  }
  for (const v of VESTS) {
    const rl = parseRepLevel(v.source);
    if (rl > 0 && v.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({
        name: v.name, type: 'vest', repLevel: rl,
        detail: `NIJ ${v.nij} · ${v.material} · ${v.weight}kg`,
        source: v.source,
        vendorName: vendorName,
        raw: v as unknown as Record<string, unknown>,
      });
    }
  }
  for (const h of HELMETS) {
    const rl = parseRepLevel(h.source);
    if (rl > 0 && h.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({
        name: h.name, type: 'helmet', repLevel: rl,
        detail: `NIJ ${h.nij} · ${h.material} · ${h.weight}kg`,
        source: h.source,
        vendorName: vendorName,
        raw: h as unknown as Record<string, unknown>,
      });
    }
  }

  return items.sort((a, b) => a.repLevel - b.repLevel || a.name.localeCompare(b.name));
}

function buildModal(item: VendorItem): ModalItem {
  const ammoKey = item.type === 'ammo' && item.raw ? `${(item.raw as Record<string, unknown>).caliber} ${item.name}` : item.name;
  const base = { name: item.name, image: (itemImages[ammoKey as keyof typeof itemImages] || itemImages[item.name as keyof typeof itemImages]) as string | undefined };

  if (item.type === 'weapon') {
    if (item.raw) {
      const w = item.raw as Record<string, string>;
      return {
        ...base, type: 'weapon',
        fields: [
          { label: 'Type', value: w.type || '-', desc: 'Weapon classification' },
          { label: 'Caliber', value: w.caliber || '-', desc: 'Ammunition type' },
          { label: 'Mag Size', value: w.magSize ? `${w.magSize} rds` : '-', desc: 'Standard magazine capacity' },
          { label: 'Fire Rate', value: w.fireRate ? `${w.fireRate} RPM` : '-', desc: 'Rounds per minute' },
          { label: 'Source', value: item.source || '-', desc: 'Where to obtain this item' },
        ],
      };
    }
    return { ...base, type: 'weapon', fields: [{ label: 'Vendor', value: item.source || '-', desc: 'Selling vendor' }, { label: 'Details', value: item.detail, desc: 'Item description' }] };
  }
  if (item.type === 'ammo' && item.raw) {
    const a = item.raw as Record<string, string | number | Record<string, number>>;
    const pen = a.pen as Record<string, number> | undefined;
    const penStr = pen ? Object.entries(pen).filter(([, v]) => v > 0).map(([k]) => k).join(' / ') : '-';
    return {
      ...base, type: 'ammo',
      fields: [
        { label: 'Caliber', value: a.caliber as string || '-', desc: 'Ammunition caliber' },
        { label: 'Speed', value: a.speed ? `${a.speed} m/s` : '-', desc: 'Muzzle velocity' },
        { label: 'Penetration', value: penStr, desc: 'Armor classes this round can penetrate' },
        { label: 'Source', value: item.source || '-', desc: 'Where to obtain this item' },
      ],
    };
  }
  if (item.type === 'vest') {
    if (item.raw) {
      const v = item.raw as Record<string, string | number>;
      return {
        ...base, type: 'vest',
        fields: [
          { label: 'NIJ Class', value: v.nij as string || '-', desc: 'Protection rating' },
          { label: 'Material', value: v.material as string || '-', desc: 'Armor material type' },
          { label: 'Plates', value: v.plates as string || '-', desc: 'Plate coverage areas' },
          { label: 'Grid', value: v.grid as string || '-', desc: 'Inventory grid size' },
          { label: 'Weight', value: v.weight ? `${v.weight} kg` : '-', desc: 'Carry weight' },
          { label: 'Source', value: item.source || '-', desc: 'Where to obtain this item' },
        ],
      };
    }
    return { ...base, type: 'vest', fields: [{ label: 'Vendor', value: item.source || '-', desc: 'Selling vendor' }, { label: 'Details', value: item.detail, desc: 'Item description' }] };
  }
  if (item.type === 'helmet') {
    if (item.raw) {
      const h = item.raw as Record<string, string | number>;
      return {
        ...base, type: 'helmet',
        fields: [
          { label: 'NIJ Class', value: h.nij as string || '-', desc: 'Protection rating' },
          { label: 'Material', value: h.material as string || '-', desc: 'Helmet material type' },
          { label: 'Weight', value: h.weight ? `${h.weight} kg` : '-', desc: 'Carry weight' },
          { label: 'Source', value: item.source || '-', desc: 'Where to obtain this item' },
        ],
      };
    }
    return { ...base, type: 'helmet', fields: [{ label: 'Vendor', value: item.source || '-', desc: 'Selling vendor' }, { label: 'Details', value: item.detail, desc: 'Item description' }] };
  }
  // Fallback - shouldn't reach here with current data
  return { ...base, type: 'ammo', fields: [{ label: 'Source', value: item.source || '-' }] };
}

const TYPE_ICONS: Record<string, string> = {
  weapon: 'fas fa-crosshairs',
  ammo: 'fas fa-bolt',
  vest: 'fas fa-vest',
  helmet: 'fas fa-hard-hat',
};

const VENDOR_META: Record<string, { icon: string; color: string }> = {
  handshake: { icon: 'fas fa-handshake', color: '#e8b830' },
  gunny: { icon: 'fas fa-crosshairs', color: '#22c55e' },
  labrat: { icon: 'fas fa-flask', color: '#3b82f6' },
  artisan: { icon: 'fas fa-wrench', color: '#8ba34e' },
  turncoat: { icon: 'fas fa-user-secret', color: '#a855f7' },
  banshee: { icon: 'fas fa-ghost', color: '#ec4899' },
  vulture: { icon: 'fas fa-dove', color: '#78716c' },
};

export default function VendorGuide() {
  const [selected, setSelected] = useState(VENDORS[0].slug);
  const [reps, setReps] = useState(getVendorReps());

  const vendor = VENDORS.find((v) => v.slug === selected);
  const repData = reps.find((r) => r.slug === selected);
  const items = vendor ? getVendorItems(vendor.name) : [];
  const meta = VENDOR_META[selected] || VENDOR_META.handshake;
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const levels = useMemo(() => {
    const ls = new Set(items.map((i) => i.repLevel));
    return [...ls].sort((a, b) => a - b);
  }, [items]);

  const updateRep = (val: string) => {
    const n = parseInt(val) || 0;
    if (vendor) {
      setVendorRep(vendor.slug, n);
      setReps(getVendorReps());
    }
  };

  const pct = repData && repData.maxRep > 0 ? Math.round((repData.rep / repData.maxRep) * 100) : 0;

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-store text-accent text-sm" />
        <span className="section-title">Vendor Guide</span>
      </div>

      {/* Vendor selector with icons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {VENDORS.map((v) => {
          const rd = reps.find((r) => r.slug === v.slug);
          const vpct = rd && rd.maxRep > 0 ? Math.round((rd.rep / rd.maxRep) * 100) : 0;
          const vm = VENDOR_META[v.slug] || VENDOR_META.handshake;
          return (
            <button
              key={v.slug}
              onClick={() => setSelected(v.slug)}
              className={`chip ${selected === v.slug ? 'active' : ''}`}
              style={selected === v.slug ? { borderColor: vm.color, color: vm.color } : {}}
            >
              <i className={`${vm.icon} text-[10px]`} />
              {v.name}
              <span className="text-[9px] ml-1 opacity-60">{vpct}%</span>
            </button>
          );
        })}
      </div>

      {vendor && repData && (
        <>
          {/* Vendor header — improved "Your Rep" section */}
          <div className="card p-0 mb-4 overflow-hidden" style={{ borderColor: meta.color + '40' }}>
            {/* Top: vendor identity */}
            <div className="p-4 flex items-start justify-between flex-wrap gap-3" style={{ background: `${meta.color}04` }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center border overflow-hidden" style={{ borderColor: meta.color + '40', background: meta.color + '12' }}>
                  {vendorImages[selected as keyof typeof vendorImages] ? (
                    <img src={vendorImages[selected as keyof typeof vendorImages] as string} alt={vendor.name} className="w-full h-full object-contain" />
                  ) : (
                    <i className={`${meta.icon} text-xl`} style={{ color: meta.color }} />
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: meta.color }}>{vendor.name}</div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{vendor.desc}</div>
                </div>
              </div>

              {/* Rep card */}
              <div className="bg-surface-2 border border-border p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    <i className="fas fa-arrow-up mr-1" style={{ color: meta.color }} />
                    Your Reputation
                  </span>
                  <span className={`text-lg font-bold font-mono ${pct >= 90 ? 'text-green' : ''}`} style={pct < 90 ? { color: meta.color } : {}}>
                    {pct}%
                  </span>
                </div>
                {vendor.slug === 'vulture' && (
                  <div className="text-[8px] font-mono text-text-muted/60 mb-2 leading-tight">
                    <i className="fas fa-info-circle mr-1" />
                    Vulture rep is earned via tasks and selling valuables (half price). Buying/selling regular items doesn't give rep.
                  </div>
                )}
                <div className="progress mb-2" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={repData.rep}
                    onChange={(e) => updateRep(e.target.value)}
                    className="input input-sm flex-1 text-right text-sm font-bold font-mono"
                    style={{ borderColor: meta.color + '30' }}
                    min={0}
                    max={vendor.maxRep}
                    aria-label={`${vendor.name} reputation`}
                  />
                  <span className="text-xs font-mono text-text-muted">/ {formatNumber(vendor.maxRep)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items per level */}
          {levels.map((level) => {
            const levelItems = items.filter((i) => i.repLevel === level);
            const idx = level - 1; // levels are 1-indexed, array is 0-indexed
            const levelRepNeeded = vendor?.rankCumulative?.[idx] ?? level * 2500;
            const isUnlocked = repData.rep >= levelRepNeeded;
            return (
              <div key={level} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag" style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>R.{level}</span>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                    Rep Level {level} — {levelItems.length} item{levelItems.length !== 1 ? 's' : ''}
                    <span className="ml-2 text-text-muted/50">({formatNumber(levelRepNeeded)} rep)</span>
                  </span>
                  <span className={`text-[10px] font-mono ml-auto flex items-center gap-1 ${isUnlocked ? 'text-green' : 'text-text-muted/50'}`}>
                    <i className={`fas fa-${isUnlocked ? 'lock-open' : 'lock'}`} />
                    {isUnlocked ? 'Unlocked' : `${formatNumber(levelRepNeeded)} rep needed`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {levelItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setModalItem(buildModal(item))}
                      className="flex items-center gap-2 bg-surface-2 border p-2.5 text-left w-full hover:border-accent/30 transition-colors"
                      style={{ borderColor: meta.color + '15' }}
                    >
                      {itemImages[item.name as keyof typeof itemImages] && (
                        <img src={itemImages[item.name as keyof typeof itemImages] as string} alt="" className="w-9 h-9 object-contain shrink-0 bg-surface border" style={{ borderColor: meta.color + '20' }} loading="lazy" />
                      ) || item.type === 'ammo' && item.raw && itemImages[`${(item.raw as Record<string, unknown>).caliber} ${item.name}` as keyof typeof itemImages] && (
                        <img src={itemImages[`${(item.raw as Record<string, unknown>).caliber} ${item.name}` as keyof typeof itemImages] as string} alt="" className="w-9 h-9 object-contain shrink-0 bg-surface border" style={{ borderColor: meta.color + '20' }} loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium flex items-center gap-1.5">
                          <i className={`${TYPE_ICONS[item.type] || 'fas fa-box'} text-[9px]`} style={{ color: meta.color + '99' }} />
                          {item.name}
                        </div>
                        <div className="text-[9px] font-mono text-text-muted/70 truncate">{item.detail}</div>
                      </div>
                      <span className="text-[8px] font-mono uppercase text-text-muted/40 shrink-0">{item.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-store" aria-hidden="true" />
              <p>No scraped item data available for this vendor</p>
              <p className="text-[9px] text-text-muted/50 mt-1">Weapon and ammo data from wiki — gear/medical/attachments not available as text</p>
            </div>
          )}
        </>
      )}
      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
