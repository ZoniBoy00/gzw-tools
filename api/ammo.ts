import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AMMO, CALIBERS } from '../_data/index';
import type { ApiResponse } from '../_data/types';
import { createHandler } from '../_lib/handler';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { caliber } = req.query;
  let data = AMMO;

  if (caliber && typeof caliber === 'string') {
    data = data.filter((a) => a.caliber === decodeURIComponent(caliber));
  }

  const response: ApiResponse<typeof data & { calibers: string[] }> = {
    data: { ...data, calibers: CALIBERS } as any,
    count: data.length,
    source: 'GZW Wiki — Ballistics page',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}

export default createHandler(handler, { rateLimit: 120 });
