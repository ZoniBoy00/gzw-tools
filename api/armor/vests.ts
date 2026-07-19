import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VESTS } from '../_data/index.js';
import type { ApiResponse } from '../_data/types.js';
import { createHandler } from '../_lib/handler.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  const response: ApiResponse<typeof VESTS> = {
    data: VESTS,
    count: VESTS.length,
    source: 'GZW Wiki — Armor Vests page',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

export default createHandler(handler);
