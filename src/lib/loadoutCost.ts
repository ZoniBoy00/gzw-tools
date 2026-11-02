import type { VendorStockRow } from './api';
import { VENDORS } from './calc';
import { rankForRep } from './vendors';
import { parseMoney } from './loot';
import type { VendorRep } from './vendortracker';

export function quoteLoadout(items: string[], stock: VendorStockRow[], reps: VendorRep[]) {
  const rows = items.filter(Boolean).map(item => {
    const offers = stock.filter(row => row.item.trim().toLowerCase() === item.trim().toLowerCase()).map(row => {
      const vendor = VENDORS.find(v => v.name.toLowerCase() === row.vendor.toLowerCase());
      const rep = reps.find(r => r.slug === vendor?.slug)?.rep ?? 0;
      const currentRank = vendor ? rankForRep(vendor.rankCumulative, rep) : null;
      const available = row.rank === null || currentRank === null ? null : currentRank >= row.rank;
      // Accept one unambiguous dollar amount, never ranges or bundle descriptions.
      const price = row.buyPrice && /^\s*\$?\s*\d+(?:[,.]\d+)*\s*$/.test(row.buyPrice) ? parseMoney(row.buyPrice) : null;
      return { ...row, price, available, currentRank };
    });
    const availablePrices = offers.filter(o => o.available === true && o.price !== null).map(o => o.price as number);
    const price = availablePrices.length ? Math.min(...availablePrices) : null;
    return { item, offers, price };
  });
  return { rows, subtotal: rows.reduce((sum, row) => sum + (row.price ?? 0), 0), missing: rows.filter(row => row.price === null).length };
}
