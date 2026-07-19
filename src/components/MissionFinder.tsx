import { useState, useMemo } from 'react';
import tasksData from '../data/tasks.json';

interface Task {
  id: string;
  name: string;
  vendor: string;
  area: string;
  type: string;
  objectives?: string[];
}

const tasks = tasksData as Task[];

const VENDORS = [...new Set(tasks.map((t) => t.vendor).filter(Boolean))].sort();
const AREAS = [...new Set(tasks.map((t) => t.area).filter(Boolean))].sort();
const TYPES = [...new Set(tasks.map((t) => t.type).filter(Boolean))].sort();

export default function MissionFinder() {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'vendor'>('vendor');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.vendor && t.vendor.toLowerCase().includes(q)) ||
          (t.area && t.area.toLowerCase().includes(q)),
      );
    }
    if (vendorFilter) data = data.filter((t) => t.vendor === vendorFilter);
    if (areaFilter) data = data.filter((t) => t.area === areaFilter);
    if (typeFilter) data = data.filter((t) => t.type === typeFilter);
    data.sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : (a.vendor || '').localeCompare(b.vendor || '')));
    return data;
  }, [search, vendorFilter, areaFilter, typeFilter, sortBy]);

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-clipboard-list text-accent text-sm" />
        <span className="section-title">Mission Finder</span>
      </div>
      <p className="text-[10px] font-mono text-text-muted mb-4">
        {tasks.length} missions from 6 vendors — search by name, vendor, or location
      </p>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search missions..."
          className="input flex-1 min-w-[160px] input-sm"
          aria-label="Search missions"
        />
        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="input w-auto input-sm" aria-label="Filter by vendor">
          <option value="">All Vendors</option>
          {VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="input w-auto input-sm hidden sm:inline-block" aria-label="Filter by area">
          <option value="">All Areas</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto input-sm" aria-label="Filter by type">
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => setSortBy((s) => (s === 'name' ? 'vendor' : 'name'))}
          className="chip chip-sm"
        >
          <i className="fas fa-arrow-down-a-z text-[9px]" />
          {sortBy === 'name' ? 'Name' : 'Vendor'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-1 animate-stagger">
        {filtered.map((t) => {
          const isExpanded = expanded === t.id;
          return (
            <div
              key={t.id}
              className={`border transition-colors ${
                isExpanded ? 'border-accent/40 bg-accent/[0.02]' : 'border-border hover:border-border-light'
              }`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : t.id)}
                className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-1.5 h-1.5 shrink-0 ${vendorColor(t.vendor)}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-[10px] font-mono text-text-muted flex items-center gap-2">
                      {t.vendor && <span className="tag tag-drab text-[8px]">{t.vendor}</span>}
                      {t.area && <span className="truncate">{t.area}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.type && t.type !== 'unknown' && (
                    <span className="text-[9px] font-mono text-text-muted/50 uppercase">{t.type}</span>
                  )}
                  <i className={`fas fa-chevron-down text-[9px] text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isExpanded && (
                <div className="px-3.5 pb-3 border-t border-border/50 pt-2 text-xs font-mono space-y-1">
                  {t.vendor && <div><span className="text-text-muted">Vendor </span><span className="tag tag-drab text-[9px]">{t.vendor}</span></div>}
                  {t.area && <div><span className="text-text-muted">Area </span><span>{t.area}</span></div>}
                  {t.type && t.type !== 'unknown' && <div><span className="text-text-muted">Type </span><span className="uppercase">{t.type}</span></div>}
                  {t.objectives && t.objectives.length > 0 && (
                    <div>
                      <span className="text-text-muted">Objectives</span>
                      <ul className="list-disc list-inside text-text-muted/80 mt-1 space-y-0.5">
                        {t.objectives.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-[9px] text-text-muted/40">ID: {t.id}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-clipboard-list" aria-hidden="true" />
            <p>No missions match your filters</p>
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono text-text-muted/60">
        <span><i className="fas fa-database mr-1" />{filtered.length} / {tasks.length}</span>
        {vendorFilter && <button onClick={() => setVendorFilter('')} className="text-accent/70 hover:text-accent">Clear vendor</button>}
        {areaFilter && <button onClick={() => setAreaFilter('')} className="text-accent/70 hover:text-accent">Clear area</button>}
        {typeFilter && <button onClick={() => setTypeFilter('')} className="text-accent/70 hover:text-accent">Clear type</button>}
      </div>
    </div>
  );
}

function vendorColor(vendor: string): string {
  const colors: Record<string, string> = {
    Handshake: 'bg-accent',
    Gunny: 'bg-green',
    'Lab Rat': 'bg-blue',
    Artisan: 'bg-drab',
    Turncoat: 'bg-red',
    Banshee: 'bg-[#a855f7]',
  };
  return colors[vendor] || 'bg-text-muted';
}
