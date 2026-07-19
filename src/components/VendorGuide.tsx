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

  // Weapons
  for (const w of WEAPONS) {
    const rl = parseRepLevel(w.source);
    if (rl > 0 && w.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({ name: w.name, type: 'weapon', repLevel: rl, detail: `${w.type} · ${w.caliber} · ${w.magSize}rds` });
    }
  }

  // Ammo
  for (const a of AMMO) {
    if (a.vendor?.toLowerCase() === vendorName.toLowerCase() && a.repLevel) {
      items.push({
        name: a.name,
        type: 'ammo',
        repLevel: a.repLevel,
        detail: `${a.caliber} · ${a.speed}m/s`,
      });
    }
  }

  // Vests
  for (const v of VESTS) {
    const rl = parseRepLevel(v.source);
    if (rl > 0 && v.source.toLowerCase().includes(vendorName.toLowerCase())) {
      items.push({ name: v.name, type: 'vest', repLevel: rl, detail: `NIJ ${v.nij} · ${v.material} · ${v.weight}kg` });
    }
  }

  // Helmets
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

export default function VendorGuide() {
  const [selected, setSelected] = useState(VENDORS[0].slug);
  const [reps, setReps] = useState(getVendorReps());

  const vendor = VENDORS.find((v) => v.slug === selected);
  const repData = reps.find((r) => r.slug === selected);
  const items = vendor ? getVendorItems(vendor.name) : [];

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

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-store text-accent text-sm" />
        <span className="section-title">Vendor Guide</span>
      </div>

      {/* Vendor selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {VENDORS.map((v) => {
          const rd = reps.find((r) => r.slug === v.slug);
          const pct = rd && rd.maxRep > 0 ? Math.round((rd.rep / rd.maxRep) * 100) : 0;
          return (
            <button
              key={v.slug}
              onClick={() => setSelected(v.slug)}
              className={`chip ${selected === v.slug ? 'active' : ''}`}
            >
              {v.name}
              <span className="text-[9px] ml-1 opacity-60">{pct}%</span>
            </button>
          );
        })}
      </div>

      {vendor && repData && (
        <>
          {/* Vendor header */}
          <div className="card card-highlight p-4 mb-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-bold">{vendor.name}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{vendor.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-text-muted mb-1">Your Rep</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={repData.rep}
                    onChange={(e) => updateRep(e.target.value)}
                    className="input input-sm w-24 text-right"
                    min={0}
                    max={vendor.maxRep}
                    aria-label={`${vendor.name} reputation`}
                  />
                  <span className="text-xs font-mono text-text-muted">/ {formatNumber(vendor.maxRep)}</span>
                </div>
                <div className="progress mt-1 w-40 ml-auto">
                  <div
                    className="progress-fill amber"
                    style={{ width: `${repData.maxRep > 0 ? (repData.rep / repData.maxRep) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items per level */}
          {levels.map((level) => {
            const levelItems = items.filter((i) => i.repLevel === level);
            return (
              <div key={level} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag tag-amber">R.{level}</span>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                    Rep Level {level} — {levelItems.length} item{levelItems.length !== 1 ? 's' : ''}
                  </span>
                  {repData.rep >= (level === 1 ? 0 : level * 2500) && (
                    <span className="text-[9px] text-green ml-auto">
                      <i className="fas fa-lock-open mr-1" />
                      {repData.rep >= (level * 2500) ? 'Unlocked' : 'Locked'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {levelItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-surface-2 border border-border p-2.5">
                      {itemImages[item.name as keyof typeof itemImages] && (
                        <img src={itemImages[item.name as keyof typeof itemImages] as string} alt="" className="w-8 h-8 object-contain shrink-0 bg-surface border border-border" loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium flex items-center gap-1.5">
                          <i className={`${TYPE_ICONS[item.type] || 'fas fa-box'} text-[9px] text-text-muted/60`} />
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
