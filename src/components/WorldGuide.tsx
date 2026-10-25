import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataContext } from '../lib/useDataContext';
import { wikiUrl } from '../lib/api';
import type { BossEntry, RegionEntry } from '../lib/api';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type WorldTab = 'regions' | 'bosses';

function isKnown(value: string): boolean {
  return !!value.trim() && !/^\?+$/.test(value.trim());
}

function isUsefulRegionDescription(description: string): boolean {
  return !!description.trim() && !/^little description of the poi/i.test(description.trim());
}

function taskNote(tasks: string): string {
  if (!tasks.trim()) return 'No task note is available in the API record.';
  if (/\bX task\b|\b\?+ task\b/i.test(tasks)) {
    return 'A task is referenced, but its name is not specified in the current API data.';
  }
  return tasks;
}

function RegionCard({ region, onOpen }: { region: RegionEntry; onOpen: (item: ModalItem) => void }) {
  const open = () => onOpen({
    name: region.name,
    image: region.image,
    type: 'region',
    fields: [
      ...(region.tier ? [{ label: 'Tier', value: region.tier, desc: 'Region difficulty tier' }] : []),
      { label: 'Locals', value: isKnown(region.localsType) ? region.localsType : 'Not listed', desc: 'Local faction' },
      { label: region.lzCallsigns.length === 1 ? 'LZ Callsign' : 'LZ Callsigns', value: region.lzCallsigns.length ? region.lzCallsigns.join(', ') : 'Not listed', desc: 'Landing zone callsigns' },
    ],
    text: isUsefulRegionDescription(region.description) ? [region.description] : undefined,
    link: { label: 'View on Wiki', url: wikiUrl(region.name) },
  });

  return (
    <article className="card p-3 flex flex-col gap-3 cursor-pointer hover:border-accent" onClick={open}>
      <div className="flex items-start gap-3">
        {region.image && (
          <img crossOrigin="anonymous"
            src={region.image}
            alt=""
            loading="lazy"
            className="w-16 h-16 shrink-0 object-cover border border-border bg-surface-2"
            onError={event => { event.currentTarget.hidden = true; }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold leading-tight">
              <button type="button" className="text-left hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${region.name} details`}>{region.name}</button>
            </h2>
            {region.tier && <span className="tag">Tier {region.tier}</span>}
          </div>
          <p className="mt-1 text-[10px] font-mono text-text-muted">
            <i className="fas fa-person-rifle mr-1" aria-hidden="true" />
            {isKnown(region.localsType) ? region.localsType : 'Local faction not listed'}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">LZ callsign{region.lzCallsigns.length === 1 ? '' : 's'}</div>
        {region.lzCallsigns.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {region.lzCallsigns.map(callsign => (
              <span key={callsign} className="border border-accent/25 bg-accent/5 px-2 py-1 font-mono text-[10px] text-accent">
                {callsign}
              </span>
            ))}
          </div>
        ) : <p className="text-xs text-text-muted">No LZ callsigns listed</p>}
      </div>

      {isUsefulRegionDescription(region.description) && (
        <p className="text-xs leading-relaxed text-text-muted">{region.description}</p>
      )}

      <span className="mt-auto text-[10px] text-accent">Details</span>
    </article>
  );
}

function BossCard({ boss, onViewRegion, onOpen }: { boss: BossEntry; onViewRegion: (location: string) => void; onOpen: (item: ModalItem) => void }) {
  const image = boss.image && !boss.image.includes('UnknownVendor_Small.png') ? boss.image : undefined;
  const open = () => onOpen({
    name: boss.name,
    image,
    type: 'boss',
    fields: [
      ...(isKnown(boss.fullName) && boss.fullName !== boss.name ? [{ label: 'Full Name', value: boss.fullName }] : []),
      { label: 'Faction', value: isKnown(boss.faction) ? boss.faction : 'Not listed', desc: 'Faction the boss belongs to' },
      { label: 'Location', value: isKnown(boss.location) ? boss.location : 'Not listed', desc: 'Known location' },
    ],
    text: [taskNote(boss.tasks)],
    link: { label: 'View on Wiki', url: wikiUrl(boss.name) },
  });

  return (
    <article className="card p-3 flex flex-col gap-3 cursor-pointer hover:border-accent" onClick={open}>
      <div className="flex items-start gap-3">
        {image && (
          <img crossOrigin="anonymous"
            src={image}
            alt=""
            loading="lazy"
            className="w-16 h-16 shrink-0 object-cover border border-border bg-surface-2"
            onError={event => { event.currentTarget.hidden = true; }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-tight">
            <button type="button" className="text-left hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${boss.name} details`}>{boss.name}</button>
          </h2>
          {isKnown(boss.fullName) && boss.fullName !== boss.name && (
            <p className="mt-1 text-[10px] font-mono text-text-muted">{boss.fullName}</p>
          )}
          <p className="mt-2 text-[10px] font-mono text-text-muted">
            <i className="fas fa-people-group mr-1" aria-hidden="true" />
            {isKnown(boss.faction) ? boss.faction : 'Faction not listed'}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Known location</div>
        {isKnown(boss.location) ? (
          <button
            type="button"
            onClick={event => { event.stopPropagation(); onViewRegion(boss.location); }}
            className="inline-flex items-center gap-1 text-left text-xs text-accent hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            aria-label={`View region details for ${boss.location}`}
          >
            <i className="fas fa-location-dot" aria-hidden="true" />{boss.location}
          </button>
        ) : <p className="text-xs text-text-muted">Location not listed</p>}
      </div>

      <div className="border-t border-border pt-2">
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Task connection</div>
        <p className="text-xs leading-relaxed text-text-muted">{taskNote(boss.tasks)}</p>
      </div>

      <span className="mt-auto text-[10px] text-accent">Details</span>
    </article>
  );
}

export default function WorldGuide() {
  const { regions, bosses, loading, error, worldGuideError } = useDataContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const activeTab: WorldTab = searchParams.get('tab') === 'bosses' ? 'bosses' : 'regions';
  const search = searchParams.get('search') || '';
  const setActiveTab = (tab: WorldTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'bosses') next.set('tab', 'bosses');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };
  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const query = search.trim().toLowerCase();
  const filteredRegions = useMemo(() => {
    if (!query) return regions;
    return regions.filter(region => [
      region.name,
      region.tier,
      region.localsType,
      region.lzCallsigns.join(' '),
      region.description,
    ].join(' ').toLowerCase().includes(query));
  }, [query, regions]);

  const filteredBosses = useMemo(() => {
    if (!query) return bosses;
    return bosses.filter(boss => [
      boss.name,
      boss.fullName,
      boss.faction,
      boss.location,
      boss.tasks,
    ].join(' ').toLowerCase().includes(query));
  }, [bosses, query]);

  const viewRegion = (location: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    next.set('search', location);
    setSearchParams(next, { replace: true });
  };

  if (loading) {
    return (
      <div className="tab-content">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-map-location-dot text-accent text-sm" aria-hidden="true" />
          <h1 className="section-title">Regions &amp; Bosses</h1>
        </div>
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading world intel…</p></div>
      </div>
    );
  }

  if (error) {
    return <div className="tab-content"><div className="error-message" role="alert">Failed to load data: {error}</div></div>;
  }

  const activeCount = activeTab === 'regions' ? filteredRegions.length : filteredBosses.length;
  const totalCount = activeTab === 'regions' ? regions.length : bosses.length;

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-map-location-dot text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Regions &amp; Bosses</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        Regional tiers and LZ callsigns, with known boss factions, locations, and task notes.
      </p>

      <div className="tab-bar mb-3" role="tablist" aria-label="World intel categories">
        <button
          id="regions-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'regions'}
          aria-controls="regions-panel"
          className={`tab ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          <i className="fas fa-map mr-2" aria-hidden="true" />Regions <span className="ml-1 font-mono text-[9px]">{regions.length}</span>
        </button>
        <button
          id="bosses-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'bosses'}
          aria-controls="bosses-panel"
          className={`tab ${activeTab === 'bosses' ? 'active' : ''}`}
          onClick={() => setActiveTab('bosses')}
        >
          <i className="fas fa-crosshairs mr-2" aria-hidden="true" />Bosses <span className="ml-1 font-mono text-[9px]">{bosses.length}</span>
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <span className="sr-only">Search regions and bosses</span>
          <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={activeTab === 'regions' ? 'Search regions, tiers, LZ callsigns…' : 'Search bosses, factions, locations, tasks…'}
            className="input input-sm pl-8"
            aria-label={`Search ${activeTab}`}
          />
        </label>
        <span className="text-[9px] font-mono text-text-muted" aria-live="polite">{activeCount} / {totalCount}</span>
      </div>

      {worldGuideError && (
        <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
          Some world intel could not be loaded: {worldGuideError}
        </div>
      )}

      {activeTab === 'regions' ? (
        <section id="regions-panel" role="tabpanel" aria-labelledby="regions-tab">
          {filteredRegions.length === 0 ? (
            <div className="empty-state"><i className="fas fa-map" aria-hidden="true" /><p>{regions.length ? 'No regions match your search.' : 'No region records are available.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredRegions.map(region => <RegionCard key={region.id} region={region} onOpen={setModalItem} />)}
            </div>
          )}
        </section>
      ) : (
        <section id="bosses-panel" role="tabpanel" aria-labelledby="bosses-tab">
          {filteredBosses.length === 0 ? (
            <div className="empty-state"><i className="fas fa-crosshairs" aria-hidden="true" /><p>{bosses.length ? 'No bosses match your search.' : 'No boss records are available.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredBosses.map(boss => <BossCard key={boss.id} boss={boss} onViewRegion={viewRegion} onOpen={setModalItem} />)}
            </div>
          )}
        </section>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · unknown fields are shown as unlisted rather than guessed.
      </div>
    </div>
  );
}
