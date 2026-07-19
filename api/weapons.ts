import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WEAPONS, WEAPON_TYPES } from '../_data/index';
import type { ApiResponse, WeaponEntry } from '../_data/types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const { type, caliber, search } = req.query;
  let data: WeaponEntry[] = WEAPONS;

  if (type && typeof type === 'string') {
    data = data.filter((w) => w.type === type);
  }
  if (caliber && typeof caliber === 'string') {
    data = data.filter((w) => w.caliber === decodeURIComponent(caliber));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    data = data.filter((w) => w.name.toLowerCase().includes(q) || w.caliber.toLowerCase().includes(q));
  }

  const response: ApiResponse<typeof data & { availableTypes: string[] }> = {
    data: { ...data, availableTypes: WEAPON_TYPES } as any,
    count: data.length,
    source: 'GZW Wiki',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
