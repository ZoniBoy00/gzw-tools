import type { VercelRequest, VercelResponse } from '@vercel/node';

const DOCS = {
  name: 'GZW Tools API',
  version: '1.0.0',
  description: 'Gray Zone Warfare game data API — ammo, armor, weapons, vendors',
  base_url: '/api',
  endpoints: [
    { path: '/api', method: 'GET', description: 'API documentation' },
    { path: '/api/ammo', method: 'GET', description: 'All ammunition', query: { caliber: 'Filter by caliber (e.g. 5.56x45mm)' } },
    { path: '/api/armor', method: 'GET', description: 'All armor data (vests, helmets, recommendations)' },
    { path: '/api/armor/vests', method: 'GET', description: 'All armor vests' },
    { path: '/api/armor/helmets', method: 'GET', description: 'All helmets' },
    { path: '/api/weapons', method: 'GET', description: 'All weapons', query: { type: 'Filter by weapon type', caliber: 'Filter by caliber', search: 'Search by name or caliber' } },
    { path: '/api/vendors', method: 'GET', description: 'Vendor information and rep levels' },
    { path: '/api/recommendations', method: 'GET', description: 'Gear recommendations by tier + vendor gear' },
  ],
  response_format: {
    data: 'The requested data (array or object)',
    count: 'Number of items in response',
    source: 'Data source attribution',
    timestamp: 'ISO timestamp of response',
  },
  example: '/api/ammo?caliber=5.56x45mm',
  notes: 'CORS enabled. Cache: 1 hour. Data from GZW Wiki — may not reflect latest patch.',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(DOCS);
}
