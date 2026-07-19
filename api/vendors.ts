import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VENDORS } from '../../src/lib/calc.js';
import { createHandler } from '../_lib/handler.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    data: VENDORS.map((v) => ({
      name: v.name,
      slug: v.slug,
      currentRep: v.rep,
      maxRep: v.maxRep,
      description: v.desc,
    })),
    count: VENDORS.length,
    source: 'GZW Community',
    timestamp: new Date().toISOString(),
  });
}

export default createHandler(handler);
