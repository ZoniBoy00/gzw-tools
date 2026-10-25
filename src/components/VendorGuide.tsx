import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchVendorProfiles, fetchVendorStock, wikiUrl } from '../lib/api';
import type { VendorProfile, VendorStockRow } from '../lib/api';
import { VENDORS } from '../lib/calc';
import { categoryLabel, filterStock, groupByRank, rankForRep, repToNextRank, stockCategories } from '../lib/vendors';
import { getVendorReps, setVendorRep } from '../lib/vendortracker';
import { useDataContext } from '../lib/useDataContext';

interface GuideData {
  profiles: VendorProfile[];
  stock: VendorStockRow[];
  errors: string[];
}

function ItemImage({ name, images }: { name: string; images: Record<string, string> }) {
  const src = images[name];
  if (!src) return <span className="inline-block h-9 w-9 shrink-0 border border-border bg-surface-2" aria-hidden="true" />;
  return (
    <img crossOrigin="anonymous"
      src={src}
      alt=""
      loading="lazy"
      className="h-9 w-9 shrink-0 object-contain border border-border bg-surface-2"
      onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

export default function VendorGuide() {
  const { itemImages } = useDataContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<GuideData | null>(null);
  const [reps, setReps] = useState(() => getVendorReps());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchVendorProfiles(), fetchVendorStock()]).then(([profiles, stock]) => {
      if (cancelled) return;
      const reason = (result: PromiseSettledResult<unknown>) => (result.status === 'rejected' ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : '');
      setData({
        profiles: profiles.status === 'fulfilled' ? profiles.value : [],
        stock: stock.status === 'fulfilled' ? stock.value : [],
        errors: [reason(profiles), reason(stock)].filter(Boolean),
      });
    });
    return () => { cancelled = true; };
  }, []);

  const selectedSlug = VENDORS.find(vendor => vendor.slug === searchParams.get('vendor'))?.slug ?? VENDORS[0].slug;
  const vendor = VENDORS.find(entry => entry.slug === selectedSlug) ?? VENDORS[0];
  const profile = data?.profiles.find(entry => entry.name.toLowerCase() === vendor.name.toLowerCase());
  const rep = reps.find(entry => entry.slug === vendor.slug)?.rep ?? 0;
  const currentRank = rankForRep(vendor.rankCumulative, rep);
  const nextRank = repToNextRank(vendor.rankCumulative, rep);

  const vendorStock = (data?.stock ?? []).filter(row => row.vendor.toLowerCase() === vendor.name.toLowerCase());
  const categories = stockCategories(vendorStock);
  const groups = groupByRank(filterStock(vendorStock, { search, category, maxRank: onlyAvailable ? currentRank : null }));
  const shownCount = groups.reduce((total, group) => total + group.rows.length, 0);

  const selectVendor = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug === VENDORS[0].slug) next.delete('vendor');
    else next.set('vendor', slug);
    setSearchParams(next, { replace: true });
    setCategory('');
  };

  const changeRep = (value: number) => {
    setVendorRep(vendor.slug, Math.max(0, Number.isFinite(value) ? value : 0));
    setReps(getVendorReps());
  };

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-store text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Vendors</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        What each vendor sells, which rank unlocks it, and how much reputation you still need.
      </p>

      <div className="tab-bar mb-3" role="tablist" aria-label="Vendors">
        {VENDORS.map(entry => (
          <button
            key={entry.slug}
            type="button"
            role="tab"
            aria-selected={entry.slug === vendor.slug}
            className={`tab ${entry.slug === vendor.slug ? 'active' : ''}`}
            onClick={() => selectVendor(entry.slug)}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <section className="card mb-4 p-3 flex flex-col gap-3" aria-label={`${vendor.name} profile`}>
        <div className="flex items-start gap-3">
          {profile?.image && (
            <img crossOrigin="anonymous"
              src={profile.image}
              alt=""
              className="h-16 w-16 shrink-0 object-cover border border-border bg-surface-2"
              onError={event => { event.currentTarget.hidden = true; }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight">{vendor.name}</h2>
            <p className="mt-1 text-[10px] font-mono text-text-muted">
              {profile?.fullName && profile.fullName.toLowerCase() !== 'unknown' ? `${profile.fullName} · ` : ''}{vendor.desc}
            </p>
            {profile && (profile.sells || profile.buys) && (
              <dl className="mt-2 grid gap-1 text-xs text-text-muted">
                {profile.sells && <div><dt className="inline font-bold text-text">Sells: </dt><dd className="inline">{profile.sells}</dd></div>}
                {profile.buys && <div><dt className="inline font-bold text-text">Buys: </dt><dd className="inline">{profile.buys}</dd></div>}
              </dl>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-[200px_1fr]">
          <label className="flex flex-col gap-1 text-[10px] text-text-muted">
            Your reputation with {vendor.name}
            <input
              type="number"
              min={0}
              max={vendor.maxRep}
              inputMode="numeric"
              className="input input-sm"
              value={rep}
              onChange={event => changeRep(Number(event.target.value))}
            />
          </label>
          <div className="text-xs" aria-live="polite">
            <div>
              Current rank: <span className="font-mono font-bold text-accent">R.{currentRank}</span>
              {nextRank
                ? <span className="text-text-muted"> · {nextRank.missing.toLocaleString('en-US')} rep to R.{nextRank.rank}</span>
                : <span className="text-text-muted"> · top rank</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[9px] text-text-muted">
              {vendor.rankCumulative.map((needed, index) => <span key={needed + index}>R.{index + 1}: {needed.toLocaleString('en-US')}</span>)}
            </div>
          </div>
        </div>
      </section>

      {!data ? (
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading vendor stock…</p></div>
      ) : (
        <>
          {data.errors.length > 0 && (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
              Some vendor data could not be loaded: {data.errors.join(' · ')}
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="relative min-w-[180px] flex-1">
              <span className="sr-only">Search {vendor.name} stock</span>
              <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search items…"
                className="input input-sm pl-8"
                aria-label="Search items"
              />
            </label>
            <select className="input input-sm w-auto" value={category} onChange={event => setCategory(event.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {categories.map(entry => <option key={entry} value={entry}>{categoryLabel(entry)}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <input type="checkbox" checked={onlyAvailable} onChange={event => setOnlyAvailable(event.target.checked)} />
              Only what I can buy now
            </label>
            <span className="text-[9px] font-mono text-text-muted" aria-live="polite">{shownCount} / {vendorStock.length}</span>
          </div>

          {shownCount === 0 ? (
            <div className="empty-state"><i className="fas fa-box-open" aria-hidden="true" /><p>{vendorStock.length ? 'No items match your filters.' : `No stock data is available for ${vendor.name} yet.`}</p></div>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map(group => (
                <section key={group.rank ?? 'none'} aria-label={group.rank ? `Rank ${group.rank}` : 'Rank not listed'}>
                  <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    {group.rank ? `Rank R.${group.rank}` : 'Rank not listed'}
                    {group.rank !== null && (
                      <span className={`tag ${group.rank <= currentRank ? '' : 'opacity-60'}`}>
                        {group.rank <= currentRank ? 'unlocked' : `${(vendor.rankCumulative[group.rank - 1] ?? 0).toLocaleString('en-US')} rep`}
                      </span>
                    )}
                    <span className="font-mono text-[9px]">{group.rows.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {group.rows.map(row => {
                      const locked = row.rank !== null && row.rank > currentRank;
                      return (
                        <article key={row.id} className={`card p-2 flex items-center gap-2 ${locked ? 'opacity-60' : ''}`}>
                          <ItemImage name={row.item} images={itemImages} />
                          <div className="min-w-0 flex-1">
                            <a href={wikiUrl(row.item)} target="_blank" rel="noopener noreferrer" className="block truncate text-xs font-bold hover:text-accent hover:underline">{row.item}</a>
                            <div className="truncate font-mono text-[9px] text-text-muted">
                              {[row.type, categoryLabel(row.category), row.buyPrice].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          {locked && <i className="fas fa-lock text-[10px] text-text-muted" aria-label="Locked at your rank" />}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · stock and ranks come from the community wiki and may lag behind the game. Your reputation is stored only in this browser.
      </div>
    </div>
  );
}
