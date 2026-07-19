import { useState, useMemo } from 'react';
import tasksData from '../data/tasks.json';

interface Task {
  id: string;
  name: string;
  vendor: string;
  area: string;
  type: string;
  category?: string;
  objectives?: string[];
  reward_text?: string;
  difficulty?: string;
  quest_type?: string;
  requirements?: string;
  xp?: string;
  rep_reward?: string;
  money_reward?: string;
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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'vendor'>('vendor');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = ['main_task', 'side_task', 'hidden_task', 'squad_strike', 'contract', 'unknown'];
    const result: { key: string; label: string; icon: string }[] = [];
    for (const c of cats) {
      const count = tasks.filter((t) => t.category === c || t.type === c).length;
      if (count > 0) {
        const labels: Record<string, string> = { main_task: 'Main Tasks', side_task: 'Side Tasks', hidden_task: 'Hidden Tasks', squad_strike: 'Squad Strikes', contract: 'Contracts', unknown: 'Other' };
        const icons: Record<string, string> = { main_task: 'fas fa-star', side_task: 'fas fa-list', hidden_task: 'fas fa-eye-slash', squad_strike: 'fas fa-people-group', contract: 'fas fa-file-contract', unknown: 'fas fa-question' };
        result.push({ key: c, label: `${labels[c] || c} (${count})`, icon: icons[c] || 'fas fa-circle' });
      }
    }
    return result;
  }, []);

  const filtered = useMemo(() => {
    let data = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((t) => t.name.toLowerCase().includes(q) || (t.vendor && t.vendor.toLowerCase().includes(q)) || (t.area && t.area.toLowerCase().includes(q)));
    }
    if (vendorFilter) data = data.filter((t) => t.vendor === vendorFilter);
    if (areaFilter) data = data.filter((t) => t.area === areaFilter);
    if (typeFilter) data = data.filter((t) => t.type === typeFilter);
    if (categoryFilter) data = data.filter((t) => t.category === categoryFilter || t.type === categoryFilter);
    data.sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : (a.vendor || '').localeCompare(b.vendor || '')));
    return data;
  }, [search, vendorFilter, areaFilter, typeFilter, categoryFilter, sortBy]);

  // Group filtered by category
  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const t of filtered) {
      const cat = t.category || t.type || 'unknown';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [filtered]);

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
          {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <button
          onClick={() => setSortBy((s) => (s === 'name' ? 'vendor' : 'name'))}
          className="chip chip-sm"
        >
          <i className="fas fa-arrow-down-a-z text-[9px]" />
          {sortBy === 'name' ? 'Name' : 'Vendor'}
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setCategoryFilter('')} className={`chip chip-sm ${!categoryFilter ? 'active' : ''}`}>
          <i className="fas fa-list text-[9px]" /> All
        </button>
        {categories.map((c) => (
          <button key={c.key} onClick={() => setCategoryFilter(c.key)} className={`chip chip-sm ${categoryFilter === c.key ? 'active' : ''}`}>
            <i className={`${c.icon} text-[9px]`} /> {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {categoryFilter ? (
        /* Single category view */
        <div className="space-y-1 animate-stagger">
          {filtered.map((t) => <MissionRow key={t.id} task={t} expanded={expanded} setExpanded={setExpanded} />)}
          {filtered.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-clipboard-list" aria-hidden="true" />
              <p>No missions match your filters</p>
            </div>
          )}
        </div>
      ) : (
        /* Grouped view */
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, missions]) => {
            const catInfo = categories.find((c) => c.key === cat);
            if (!catInfo) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <i className={`${catInfo.icon} text-accent/60 text-xs`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{catInfo.label}</span>
                </div>
                <div className="space-y-1">
                  {missions.map((t) => <MissionRow key={t.id} task={t} expanded={expanded} setExpanded={setExpanded} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

function MissionRow({ task, expanded, setExpanded }: { task: Task; expanded: string | null; setExpanded: (id: string | null) => void }) {
  const isExpanded = expanded === task.id;
  return (
    <div className={`border transition-colors ${isExpanded ? 'border-accent/40 bg-accent/[0.02]' : 'border-border hover:border-border-light'}`}>
      <button onClick={() => setExpanded(isExpanded ? null : task.id)} className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-1.5 h-1.5 shrink-0 ${vendorColor(task.vendor)}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{task.name}
              {task.category === 'hidden_task' && <span className="tag tag-amber text-[8px] ml-2">Hidden</span>}
              {task.category === 'main_task' && <span className="tag text-[8px] ml-2" style={{background:'rgba(59,130,246,0.15)',color:'#3b82f6'}}>Main</span>}
              {task.category === 'side_task' && <span className="tag text-[8px] ml-2" style={{background:'rgba(34,197,94,0.15)',color:'#22c55e'}}>Side</span>}
              {task.category === 'squad_strike' && <span className="tag text-[8px] ml-2" style={{background:'rgba(168,85,247,0.15)',color:'#a855f7'}}>Squad</span>}
            </div>
            <div className="text-[10px] font-mono text-text-muted flex items-center gap-2">
              {task.vendor && <span className="tag tag-drab text-[8px]">{task.vendor}</span>}
              {task.area && <span className="truncate">{task.area}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <i className={`fas fa-chevron-down text-[9px] text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isExpanded && (
        <div className="px-3.5 pb-3 border-t border-border/50 pt-2 text-xs font-mono space-y-1.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {task.vendor && <div><span className="text-text-muted">Vendor </span><span className="tag tag-drab text-[9px]">{task.vendor}</span></div>}
            {task.area && <div><span className="text-text-muted">Area </span><span>{task.area}</span></div>}
            {task.difficulty && <div><span className="text-text-muted">Difficulty </span><span>{task.difficulty}</span></div>}
          </div>
          {task.objectives && task.objectives.length > 0 && (
            <div>
              <div className="text-text-muted text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <i className="fas fa-list-check text-accent/60" /> Objectives
              </div>
              <ul className="space-y-0.5">
                {task.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-text-muted/90">
                    <span className="text-accent/60 mt-0.5 shrink-0">{i + 1}.</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.reward_text && (
            <div>
              <div className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <i className="fas fa-gift text-accent/60" /> Rewards
              </div>
              <p className="text-text-muted/90">{task.reward_text}</p>
            </div>
          )}
          <div className="pt-2 flex items-center gap-3 text-[9px]">
            <a href={`https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(task.name)}`} target="_blank" rel="noopener noreferrer" className="text-accent/70 hover:text-accent transition-colors flex items-center gap-1">
              <i className="fas fa-external-link-alt text-[8px]" /> View on Wiki
            </a>
            <span className="text-text-muted/30">ID: {task.id}</span>
            {task.objectives && <span className="text-text-muted/30">{task.objectives.length} objectives</span>}
          </div>
        </div>
      )}
    </div>
  );
}
