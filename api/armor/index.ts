import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VESTS, HELMETS, RECOMMENDATIONS, MATERIAL_RANK } from '../_data/index';
import type { ApiResponse } from '../_data/types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const response: ApiResponse<{ vests: typeof VESTS; helmets: typeof HELMETS; recommendations: typeof RECOMMENDATIONS; materialRank: typeof MATERIAL_RANK }> = {
    data: { vests: VESTS, helmets: HELMETS, recommendations: RECOMMENDATIONS, materialRank: MATERIAL_RANK },
    count: VESTS.length + HELMETS.length,
    source: 'GZW Wiki',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
