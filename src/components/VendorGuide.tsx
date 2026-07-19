import { useState, useMemo } from 'react';
import { VENDORS, formatNumber } from '../lib/calc';
import { getVendorReps, setVendorRep } from '../lib/vendortracker';
import { AMMO } from '../data/ammo';
import { WEAPONS } from '../data/weapons';
import { VESTS, HELMETS, VENDOR_GEAR } from '../data/armor';
import itemImages from '../data/item_images.json';

interface VendorItem {
  name: string;
  type: 'weapon' | 'ammo' | 'vest' | 'helmet';
  repLevel: number;
  detail: string;
  image?: string;
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
      items.push({ name: w.name, type: 'weapon', repLevel: rl, detail: `${w.type} · ${w.caliber} · ${w.magSize}rds` });
    }
  }
  for (const a of AMMO) {
    if (a.vendor?.toLowerCase() === vendorName.toLowerCase() && a.repLevel) {
      items.push({ name: a.name, type: 'ammo', repLevel: a.repLevel, detail: `${a.caliber} · ${a.speed}m/s` });
    }
  }
  for (const v of VESTS) {
    const rl = parseRepLevel(v.source);
    if (rl > 0 && v.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({ name: v.name, type: 'vest', repLevel: rl, detail: `NIJ ${v.nij} · ${v.material} · ${v.weight}kg` });
    }
  }
  for (const h of HELMETS) {
    const rl = parseRepLevel(h.source);
    if (rl > 0 && h.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({ name: h.name, type: 'helmet', repLevel: rl, detail: `NIJ ${h.nij} · ${h.material} · ${h.weight}kg` });
    }
  }

  return items.sort((a, b) => a.repLevel - b.repLevel || a.name.localeCompare(b.name));
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
};

export default function VendorGuide() {
  const [selected, setSelected] = useState(VENDORS[0].slug);
  const [reps, setReps] = useState(getVendorReps());

  const vendor = VENDORS.find((v) => v.slug === selected);
  const repData = reps.find((r) => r.slug === selected);
  const items = vendor ? getVendorItems(vendor.name) : [];
  const meta = VENDOR_META[selected] || VENDOR_META.handshake;

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
                <div className="w-12 h-12 flex items-center justify-center border" style={{ borderColor: meta.color + '40', background: meta.color + '12' }}>
                  <i className={`${meta.icon} text-xl`} style={{ color: meta.color }} />
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
            const levelRepNeeded = level * 2500;
            const isUnlocked = repData.rep >= levelRepNeeded;
            return (
              <div key={level} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag" style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>R.{level}</span>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                    Rep Level {level} — {levelItems.length} item{levelItems.length !== 1 ? 's' : ''}
                  </span>
                  <span className={`text-[10px] font-mono ml-auto flex items-center gap-1 ${isUnlocked ? 'text-green' : 'text-text-muted/50'}`}>
                    <i className={`fas fa-${isUnlocked ? 'lock-open' : 'lock'}`} />
                    {isUnlocked ? 'Unlocked' : `R.{level} needed`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {levelItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-surface-2 border p-2.5" style={{ borderColor: meta.color + '15' }}>
                      {itemImages[item.name as keyof typeof itemImages] && (
                        <img src={itemImages[item.name as keyof typeof itemImages] as string} alt="" className="w-9 h-9 object-contain shrink-0 bg-surface border" style={{ borderColor: meta.color + '20' }} loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium flex items-center gap-1.5">
                          <i className={`${TYPE_ICONS[item.type] || 'fas fa-box'} text-[9px]`} style={{ color: meta.color + '99' }} />
                          {item.name}
                        </div>
                        <div className="text-[9px] font-mono text-text-muted/70 truncate">{item.detail}</div>
                      </div>
                      <span className="text-[8px] font-mono uppercase text-text-muted/40 shrink-0">{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-store" aria-hidden="true" />
              <p>No items found for this vendor</p>
            </div>
          )}

          {/* Vendor gear table */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-table-list text-accent/60 text-xs" />
              <span className="section-title">Vendor Gear Unlocks</span>
            </div>
            <div className="table-wrap table-mobile-cards">
              <table role="table" aria-label="Vendor gear unlocks">
                <thead>
                  <tr>
                    <th role="columnheader">Rep</th>
                    <th role="columnheader">Items Unlocked</th>
                  </tr>
                </thead>
                <tbody>
                  {VENDOR_GEAR
                    .filter((g) => g.vendor === vendor.name)
                    .sort((a, b) => a.rep - b.rep)
                    .map((g, i) => (
                      <tr key={i}>
                        <td data-label="Rep" className="text-center"><span className="tag tag-drab">R.{g.rep}</span></td>
                        <td data-label="Items" className="text-text-muted">{g.items}</td>
                      </tr>
                    ))}
                  {VENDOR_GEAR.filter((g) => g.vendor === vendor.name).length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-4 text-text-muted text-xs">No unlock data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
