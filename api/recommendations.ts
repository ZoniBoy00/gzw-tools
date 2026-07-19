import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RECOMMENDATIONS, VENDOR_GEAR } from '../_data/index';
import type { ApiResponse } from '../_data/types';
import { createHandler } from '../_lib/handler';

async function handler(req: VercelRequest, res: VercelResponse) {
  const response: ApiResponse<{ recommendations: typeof RECOMMENDATIONS; vendorGear: typeof VENDOR_GEAR }> = {
    data: { recommendations: RECOMMENDATIONS, vendorGear: VENDOR_GEAR },
    count: RECOMMENDATIONS.length + VENDOR_GEAR.length,
    source: 'GZW Wiki — Armor Vests page',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

export default createHandler(handler);
