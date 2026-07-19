import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AMMO, CALIBERS } from '../_data/index';
import type { ApiResponse } from '../_data/types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const { caliber } = req.query;
  let data = AMMO;

  if (caliber && typeof caliber === 'string') {
    data = data.filter((a) => a.caliber === decodeURIComponent(caliber));
  }

  const response: ApiResponse<typeof data> = {
    data,
    count: data.length,
    source: 'GZW Wiki',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
