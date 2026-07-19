import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HELMETS } from '../_data/index';
import type { ApiResponse } from '../_data/types';
import { createHandler } from '../_lib/handler';

async function handler(req: VercelRequest, res: VercelResponse) {
  const response: ApiResponse<typeof HELMETS> = {
    data: HELMETS,
    count: HELMETS.length,
    source: 'GZW Wiki — Helmets page',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

export default createHandler(handler);
