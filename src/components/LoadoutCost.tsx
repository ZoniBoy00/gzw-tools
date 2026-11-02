import { Link } from 'react-router-dom';
import type { VendorStockRow } from '../lib/api';
import { getVendorReps } from '../lib/vendortracker';
import { quoteLoadout } from '../lib/loadoutCost';
import { formatMoney } from '../lib/loot';

export default function LoadoutCost({ items, stock }: { items: string[]; stock: VendorStockRow[] }) {
  const quote = quoteLoadout(items, stock, getVendorReps());
  if (!quote.rows.length) return null;
  return <section className="card p-3 my-3" aria-label="Loadout cost and availability">
    <h3 className="text-sm font-bold">{quote.missing ? 'Known purchasable subtotal' : 'Total purchase price'}: {formatMoney(quote.subtotal)}</h3>
    <p className="text-xs text-text-muted">One of each selected item; ammunition uses one listed sale unit. Prices exclude attachments and extra ammunition. {quote.missing > 0 && `${quote.missing} item(s) have no confirmed purchasable price.`}</p>
    <p className="text-xs my-2">Availability uses <Link className="text-accent" to="/vendors">your saved vendor reputation</Link>.</p>
    <ul className="space-y-2 text-xs">{quote.rows.map((row, index) => <li key={`${row.item}-${index}`}>
      <strong>{row.item}</strong>
      {row.offers.length === 0 ? <p>No vendor offer listed; price and availability unknown.</p> : <ul>{row.offers.map(offer => <li key={offer.id}>
        {offer.vendor} | {offer.rank === null ? 'Required rank unknown' : `Requires R.${offer.rank}`} | {offer.available === null ? 'Availability unknown' : offer.available ? 'Available' : `Locked (your rank: R.${offer.currentRank})`} | {offer.price === null ? 'Price unknown' : formatMoney(offer.price)}
      </li>)}</ul>}
    </li>)}</ul>
  </section>;
}
