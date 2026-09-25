import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../lib/useDataContext';
import { useApiData } from '../hooks/useApiData';
import { buildSiteSearchItems, mergeTaskSources, type TaskSearchRecord } from '../lib/siteSearchData';
import { searchSite } from '../lib/siteSearch';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SiteSearchDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { weapons, ammo, vests, helmets, keys } = useDataContext();
  const { data: tasksBase } = useApiData<TaskSearchRecord>('tasks');
  const { data: mainTasks } = useApiData<TaskSearchRecord>('main_task');
  const { data: sideTasks } = useApiData<TaskSearchRecord>('side_task');
  const { data: hiddenTasks } = useApiData<TaskSearchRecord>('hidden_task');
  const { data: squadTasks } = useApiData<TaskSearchRecord>('squad_strike_missions');
  const { data: contracts } = useApiData<TaskSearchRecord>('contract');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = useMemo(() => mergeTaskSources(tasksBase, mainTasks, sideTasks, hiddenTasks, squadTasks, contracts), [tasksBase, mainTasks, sideTasks, hiddenTasks, squadTasks, contracts]);
  const items = useMemo(() => buildSiteSearchItems({ weapons, ammo, vests, helmets, keys, tasks }), [weapons, ammo, vests, helmets, keys, tasks]);
  const results = useMemo(() => searchSite(items, query), [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const previousFocus = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] input, [role="dialog"] button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="mx-auto mt-[8vh] w-full max-w-2xl border border-border bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
        <h2 id="site-search-title" className="sr-only">Search GZW Tools</h2>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <i className="fas fa-magnifying-glass text-accent" aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted" placeholder="Search tasks, weapons, ammo, armor, keys, vendors…" aria-label="Search all GZW data" aria-controls="site-search-results" />
          <kbd className="hidden border border-border px-1.5 py-0.5 text-[10px] text-text-muted sm:inline">ESC</kbd>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text" aria-label="Close search"><i className="fas fa-xmark" /></button>
        </div>
        <div id="site-search-results" className="max-h-[65vh] overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {!query.trim() ? <p className="px-3 py-8 text-center text-xs text-text-muted">Start typing to search across the site.</p> : results.length ? results.map(item => (
            <button key={item.id} type="button" role="option" aria-selected="false" onClick={() => { onClose(); const params = new URLSearchParams(item.searchParams); navigate(params.size ? `${item.path}?${params}` : item.path); }} className="flex w-full items-start gap-3 border-b border-border/50 px-3 py-3 text-left transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none">
              <span className="mt-0.5 w-20 shrink-0 text-[9px] font-mono uppercase tracking-wider text-accent">{item.type}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-text">{item.title}</span>{item.detail && <span className="mt-0.5 block truncate text-[10px] text-text-muted">{item.detail}</span>}</span>
              <i className="fas fa-arrow-up-right-from-square mt-1 text-[10px] text-text-muted/60" aria-hidden="true" />
            </button>
          )) : <p className="px-3 py-8 text-center text-xs text-text-muted">No matches. Try another name, location, caliber, or vendor.</p>}
        </div>
        <div className="border-t border-border px-4 py-2 text-[9px] font-mono text-text-muted/70">Search covers tasks, weapons, ammo, armor, helmets, keys, and vendors · {items.length.toLocaleString()} indexed records</div>
      </section>
    </div>
  );
}
