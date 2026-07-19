import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../_lib/handler';

const DOCS = {
  name: 'GZW Tools API',
  version: '1.0.0',
  description: 'Gray Zone Warfare game data API — ammo, armor, weapons, vendors, recommendations',
  base_url: '/api',
  rate_limiting: {
    requests_per_minute: 100,
    headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  },
  caching: '1 hour (Cache-Control: public, max-age=3600)',
  cors: 'Enabled for all origins',
  endpoints: [
    { path: '/api', method: 'GET', description: 'API documentation (this page)' },
    { path: '/api/ammo', method: 'GET', description: 'All ammunition', query: { caliber: 'Filter by caliber (e.g. 5.56x45mm)' } },
    { path: '/api/armor', method: 'GET', description: 'All armor data (vests + helmets + recommendations)' },
    { path: '/api/armor/vests', method: 'GET', description: 'All armor vests' },
    { path: '/api/armor/helmets', method: 'GET', description: 'All helmets' },
    { path: '/api/weapons', method: 'GET', description: 'All weapons', query: { type: 'Filter by weapon type', caliber: 'Filter by caliber', search: 'Search by name or caliber' } },
    { path: '/api/vendors', method: 'GET', description: 'Vendor information and rep levels' },
    { path: '/api/recommendations', method: 'GET', description: 'Gear recommendations by tier + vendor gear unlocks' },
  ],
  response_format: {
    data: 'The requested data (array or object)',
    count: 'Number of items in response',
    source: 'Data source attribution',
    timestamp: 'ISO timestamp of response generation',
  },
  example: 'curl https://gzw-tools.vercel.app/api/ammo?caliber=5.56x45mm',
  notes: 'Data from GZW Wiki. May not reflect latest patch. This is a fan project, not affiliated with M.A.G. Studios.',
};

async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json(DOCS);
}

export default createHandler(handler, { rateLimit: 60 });
