import { useState, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import TaskModal from './TaskModal';

interface Task {
  id: string;
  name: string;
  vendor: string;
  area: string;
  location: string;
  type: string;
  alternate?: string;
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

export default function MissionFinder() {
  const { data: tasksData } = useApiData<any>('tasks');
  const { data: mainTaskData } = useApiData<any>('main_task');
  const { data: sideTaskData } = useApiData<any>('side_task');
  const { data: hiddenData } = useApiData<any>('hidden_task');
  const { data: squadData } = useApiData<any>('squad_strike_missions');
  const { data: contractData } = useApiData<any>('contract');

  const allTasks: Task[] = useMemo(() => {
    if (!tasksData.length) return [];
    const hiddenTaskIds = new Set((hiddenData as Task[]).map((h: Task) => h.id));
    const seen = new Set<string>();
    const result: Task[] = [];
    
    const add = (items: Task[], category: string) => {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          // If this item is a hidden task, mark it as hidden regardless of source
          const cat = hiddenTaskIds.has(item.id) ? 'hidden_task' : category;
          result.push({ ...item, category: cat });
        }
      }
    };
    
    add(tasksData as Task[], 'task');
    add(mainTaskData as Task[], 'main_task');
    add(sideTaskData as Task[], 'side_task');
    add(hiddenData as Task[], 'hidden_task');
    add(squadData as Task[], 'squad_strike');
    add(contractData as Task[], 'contract');
    
    return result;
  }, [tasksData, mainTaskData, sideTaskData, hiddenData, squadData, contractData]);

  const VENDORS = useMemo(() => [...new Set(allTasks.map((t) => t.vendor).filter(Boolean))].sort(), [allTasks]);
  const AREAS = useMemo(() => [...new Set((allTasks.map((t) => t.location || t.area)).filter(Boolean))].sort(), [allTasks]);
  const TYPES = useMemo(() => [...new Set(allTasks.map((t) => t.type || 'Task').filter(Boolean))].sort(), [allTasks]);

  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'vendor'>('vendor');
  const [modalTask, setModalTask] = useState<Task | null>(null);

  const categories = useMemo(() => {
    const cats = ['main_task', 'side_task', 'hidden_task', 'squad_strike', 'contract', 'task'];
    const result: { key: string; label: string; icon: string }[] = [];
    for (const c of cats) {
      const count = allTasks.filter((t) => t.category === c).length;
      const labels: Record<string, string> = { main_task: 'Main Tasks', side_task: 'Side Tasks', hidden_task: 'Hidden Tasks', squad_strike: 'Squad Strikes', contract: 'Contracts', task: 'Tasks' };
      const icons: Record<string, string> = { main_task: 'fas fa-star', side_task: 'fas fa-list', hidden_task: 'fas fa-eye-slash', squad_strike: 'fas fa-people-group', contract: 'fas fa-file-contract', task: 'fas fa-clipboard-list' };
      result.push({ key: c, label: `${labels[c] || c} (${count})`, icon: icons[c] || 'fas fa-circle' });
    }
    return result;
  }, [allTasks]);

  const filtered = useMemo(() => {
    let data = [...allTasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((t) => t.name.toLowerCase().includes(q) || (t.vendor && t.vendor.toLowerCase().includes(q)) || ((t.location || t.area) && (t.location || t.area).toLowerCase().includes(q)));
    }
    if (vendorFilter) data = data.filter((t) => t.vendor === vendorFilter);
    if (areaFilter) data = data.filter((t) => (t.location || t.area) === areaFilter);
    if (typeFilter) data = data.filter((t) => (t.type || 'Task') === typeFilter);
    if (categoryFilter) data = data.filter((t) => t.category === categoryFilter);
    data.sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : (a.vendor || '').localeCompare(b.vendor || '')));
    return data;
  }, [search, vendorFilter, areaFilter, typeFilter, categoryFilter, sortBy, allTasks]);

  // Grouped computed - currently unused
  /* grouped removed - single view used instead */

  // Rest of the component stays the same from here
  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-clipboard-list text-accent text-sm" />
        <span className="section-title">Mission Finder</span>
      </div>
      <p className="text-[10px] font-mono text-text-muted mb-4">
        {allTasks.length} missions — search by name, vendor, or location
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search missions..." className="input flex-1 min-w-[160px] input-sm" aria-label="Search missions" />
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
        <button onClick={() => setSortBy((s) => (s === 'name' ? 'vendor' : 'name'))} className="chip chip-sm">
          <i className="fas fa-arrow-down-a-z text-[9px]" /> {sortBy === 'name' ? 'Name' : 'Vendor'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setCategoryFilter('')} className={`chip chip-sm ${!categoryFilter ? 'active' : ''}`}><i className="fas fa-list text-[9px]" /> All</button>
        {categories.map((c) => (
          <button key={c.key} onClick={() => setCategoryFilter(c.key)} className={`chip chip-sm ${categoryFilter === c.key ? 'active' : ''}`}>
            <i className={`${c.icon} text-[9px]`} /> {c.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-1">
          {filtered.map((t) => (
            <div key={t.id} className="border border-border hover:border-accent/40 transition-colors">
              <button
                onClick={() => setModalTask(t)}
                className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3"
                aria-label={`View details for ${t.name}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-1.5 h-1.5 shrink-0 ${vendorColor(t.vendor)}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}
                      {t.category === 'hidden_task' && <span className="tag tag-amber text-[8px] ml-2">Hidden</span>}
                      {t.category === 'main_task' && <span className="tag tag-main text-[8px] ml-2">Main</span>}
                      {t.category === 'side_task' && <span className="tag tag-side text-[8px] ml-2">Side</span>}
                      {t.category === 'squad_strike' && <span className="tag tag-squad text-[8px] ml-2">Squad</span>}
                      {t.category === 'contract' && <span className="tag tag-contract text-[8px] ml-2">Contract</span>}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted flex items-center gap-2">
                      {t.vendor && <span className="tag tag-drab text-[8px]">{t.vendor}</span>}
                      {(t.location || t.area) && <span className="truncate">{t.location || t.area}</span>}
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-text-muted/40 hidden sm:inline">Details</span>
                  <i className="fas fa-circle-info text-[10px] text-text-muted/50" />
                </span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-clipboard-list" aria-hidden="true" />
          <p>No missions match your filters</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono text-text-muted/60">
        <span><i className="fas fa-database mr-1" />{filtered.length} / {allTasks.length}</span>
      </div>

      {modalTask && <TaskModal task={modalTask} onClose={() => setModalTask(null)} />}
    </div>
  );
}

function vendorColor(vendor: string): string {
  const colors: Record<string, string> = {
    Handshake: 'bg-accent', Gunny: 'bg-green', 'Lab Rat': 'bg-blue',
    Artisan: 'bg-drab', Turncoat: 'bg-red', Banshee: 'bg-[#a855f7]',
  };
  return colors[vendor] || 'bg-text-muted';
}
