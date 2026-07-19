import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HELMETS } from '../_data/index';
import type { ApiResponse } from '../_data/types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const response: ApiResponse<typeof HELMETS> = {
    data: HELMETS,
    count: HELMETS.length,
    source: 'GZW Wiki',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
