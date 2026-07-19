import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RECOMMENDATIONS, VENDOR_GEAR } from '../_data/index';
import type { ApiResponse } from '../_data/types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const response: ApiResponse<{ recommendations: typeof RECOMMENDATIONS; vendorGear: typeof VENDOR_GEAR }> = {
    data: { recommendations: RECOMMENDATIONS, vendorGear: VENDOR_GEAR },
    count: RECOMMENDATIONS.length + VENDOR_GEAR.length,
    source: 'GZW Wiki',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
