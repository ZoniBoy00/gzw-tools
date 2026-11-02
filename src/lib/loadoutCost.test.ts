import { describe, expect, it } from 'vitest';
import { quoteLoadout } from './loadoutCost';
import type { VendorStockRow } from './api';
const stock: VendorStockRow[] = [
  { id: 'locked', item: 'M4', vendor: 'Gunny', rank: 2, category: 'weapons', buyPrice: '$100' },
  { id: 'open', item: 'M4', vendor: 'Handshake', rank: 1, category: 'weapons', buyPrice: '$1,200' },
  { id: 'unknown', item: 'Helmet', vendor: 'Banshee', rank: null, category: 'helmets', buyPrice: '$200' },
];
describe('loadout purchase quote', () => {
  it('chooses an unlocked offer rather than a cheaper locked offer', () => {
    const quote = quoteLoadout(['M4'], stock, []);
    expect(quote.subtotal).toBe(1200);
    expect(quote.missing).toBe(0);
    expect(quote.rows[0].offers[0].available).toBe(false);
  });
  it('uses saved reputation at the exact unlock threshold', () => {
    const quote = quoteLoadout(['M4'], stock, [{ slug: 'gunny', name: 'Gunny', rep: 800, maxRep: 13000, desc: '' }]);
    expect(quote.subtotal).toBe(100);
  });
  it('keeps missing prices, unknown ranks and unknown vendors out of the total', () => {
    const quote = quoteLoadout(['Helmet', 'Missing', 'M4'], [...stock, { ...stock[0], id: 'other', vendor: 'Unknown', buyPrice: '$1' }], []);
    expect(quote.missing).toBe(2);
    expect(quote.subtotal).toBe(1200);
    expect(quote.rows[0].offers[0].available).toBeNull();
    expect(quote.rows[2].offers[2].available).toBeNull();
  });
  it('rejects ambiguous ranges and handles empty selections', () => {
    expect(quoteLoadout(['M4'], [{ ...stock[1], buyPrice: '$100 - $200' }], []).missing).toBe(1);
    expect(quoteLoadout([''], stock, []).rows).toEqual([]);
  });
});
