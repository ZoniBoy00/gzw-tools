import { useEffect, useState } from 'react';
import {
  fetchCompatibilityHost,
  fetchGameItems,
  fetchLootSources,
  findGameItem,
  formatChance,
  formatDollars,
  formatSell,
  gridLabel,
  indexItemNames,
  lootTableLabel,
  resolveSlots,
  topLootSources,
  weightLabel,
} from '../lib/gameData';
import type { CompatHost, GameItem, LootByItem } from '../lib/gameData';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pb-3">
      <h3 className="mb-1 mt-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">{title}</h3>
      {children}
    </div>
  );
}

/** Vendor offers, loot sources and compatibility of one item; loot and compatibility are fetched when the item opens. */
export function ItemExtras({ item, names }: { item: GameItem; names: Map<string, string> }) {
  const [loot, setLoot] = useState<LootByItem | undefined | null>(null);
  const [host, setHost] = useState<CompatHost | undefined | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLootSources(item.id).then(value => { if (!cancelled) setLoot(value); }).catch(() => { if (!cancelled) setFailed(true); });
    if (item.slots?.length) {
      fetchCompatibilityHost(item.id).then(value => { if (!cancelled) setHost(value); }).catch(() => { if (!cancelled) setFailed(true); });
    }
    return () => { cancelled = true; };
  }, [item.id, item.slots?.length]);

  const sources = topLootSources(loot ?? undefined);
  const slots = resolveSlots(host ?? undefined, names);

  return (
    <>
      {item.vendors && item.vendors.length > 0 && (
        <Section title="Sold by">
          <ul className="space-y-0.5 font-mono text-xs">
            {[...item.vendors].sort((a, b) => a.rank - b.rank).map(offer => (
              <li key={`${offer.vendor}-${offer.rank}`} className="flex justify-between"><span>{offer.vendor} · rank {offer.rank}</span><span className="text-accent">{formatDollars(offer.price)}</span></li>
            ))}
          </ul>
        </Section>
      )}
      {item.sell_prices && item.sell_prices.length > 0 && (
        <Section title="Vendors pay">
          <ul className="space-y-0.5 font-mono text-xs">
            {item.sell_prices.map(offer => (
              <li key={offer.vendors.join()} className="flex justify-between"><span>{offer.vendors.join(', ')}</span><span>{formatSell(offer.price)}</span></li>
            ))}
          </ul>
        </Section>
      )}
      {item.fits_on && item.fits_on.length > 0 && (
        <Section title={`Fits on (${item.fits_on.length})`}>
          <p className="text-xs leading-relaxed text-text-muted">
            {item.fits_on.slice(0, 40).map(id => names.get(id) ?? id).join(', ')}{item.fits_on.length > 40 ? ` … and ${item.fits_on.length - 40} more` : ''}
          </p>
        </Section>
      )}
      {slots.length > 0 && (
        <Section title="Attachment slots">
          <ul className="space-y-1 text-xs">
            {slots.map(slot => (
              <li key={slot.slot}>
                <details>
                  <summary className="cursor-pointer font-mono">{slot.slot}{slot.critical ? ' · required' : ''}{slot.welded ? ' · fixed' : ''} <span className="text-text-muted">({slot.accepts.length})</span></summary>
                  <p className="mt-1 leading-relaxed text-text-muted">{slot.accepts.length ? slot.accepts.map(entry => entry.name).join(', ') : 'Nothing fits this slot.'}</p>
                </details>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {sources.length > 0 && (
        <Section title="Found in">
          <ul className="space-y-0.5 font-mono text-xs">
            {sources.map(source => (
              <li key={source.table} className="flex justify-between gap-2"><span className="truncate">{lootTableLabel(source.table)}</span><span>{formatChance(source.chance_per_roll)}</span></li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-text-muted/70">Estimated: the chance of a loot rule is split evenly between its items. Not verified in game.</p>
        </Section>
      )}
      {failed && <p className="px-4 pb-3 text-[11px] text-text-muted">Some details could not be loaded.</p>}
    </>
  );
}

/**
 * Game-file details for an item that a wiki-based page shows, matched by name.
 * Renders nothing when the game files have no item with that name; the game data loads once and is shared.
 */
export function GameDataSection({ name }: { name: string }) {
  const [state, setState] = useState<{ items: GameItem[] } | 'failed' | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGameItems().then(items => { if (!cancelled) setState({ items }); }).catch(() => { if (!cancelled) setState('failed'); });
    return () => { cancelled = true; };
  }, []);

  if (state === 'failed') return null;
  if (!state) return <p className="px-4 pb-3 font-mono text-[11px] text-text-muted/70" role="status">Loading game-file details…</p>;
  const item = findGameItem(state.items, name);
  if (!item) return null;
  const weight = weightLabel(item);
  const grid = gridLabel(item);

  return (
    <div className="border-t border-border/50 pt-1">
      <Section title="From the game files">
        <dl className="space-y-0.5 font-mono text-xs">
          {weight && <div className="flex justify-between"><dt className="text-text-muted">{weight.label}</dt><dd>{weight.value}</dd></div>}
          {grid && <div className="flex justify-between"><dt className="text-text-muted">{grid.label}</dt><dd>{grid.value}</dd></div>}
          {item.base_price !== undefined && <div className="flex justify-between"><dt className="text-text-muted">Base price</dt><dd className="text-accent">{formatDollars(item.base_price)}</dd></div>}
        </dl>
        {(weight?.label === 'Base weight' || grid?.label === 'Base grid') && (
          <p className="mt-1 text-[11px] text-text-muted/70">Base values: guns, magazines, armor and rigs are measured without attached parts, ammo or plates.</p>
        )}
      </Section>
      <ItemExtras key={item.id} item={item} names={indexItemNames(state.items)} />
    </div>
  );
}
