import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VESTS, HELMETS, RECOMMENDATIONS, MATERIAL_RANK } from '../_data/index.js';
import type { ApiResponse } from '../_data/types.js';
import { createHandler } from '../_lib/handler.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  const response: ApiResponse<{
    vests: typeof VESTS;
    helmets: typeof HELMETS;
    recommendations: typeof RECOMMENDATIONS;
    materialRank: typeof MATERIAL_RANK;
  }> = {
    data: { vests: VESTS, helmets: HELMETS, recommendations: RECOMMENDATIONS, materialRank: MATERIAL_RANK },
    count: VESTS.length + HELMETS.length + RECOMMENDATIONS.length,
    source: 'GZW Wiki — Armor Vests page',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

export default createHandler(handler);
