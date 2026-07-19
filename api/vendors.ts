import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VENDORS } from '../../src/lib/calc';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  res.status(200).json({
    data: VENDORS.map((v) => ({
      name: v.name,
      slug: v.slug,
      rep: v.rep,
      description: v.desc,
      maxRep: 9750,
    })),
    count: VENDORS.length,
    source: 'GZW Community',
    timestamp: new Date().toISOString(),
  });
}
