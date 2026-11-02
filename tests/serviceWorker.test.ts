import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function worker() {
  const listeners = new Map<string, (event: any) => void>();
  const stored = new Map<string, Response>();
  const cache = {
    put: vi.fn(async (key: Request | string, value: Response) => { stored.set(typeof key === 'string' ? key : key.url, value); }),
    match: vi.fn(async (key: Request | string) => stored.get(typeof key === 'string' ? key : key.url)?.clone()),
  };
  const fetch = vi.fn();
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self: { location: { origin: 'https://gzw-tools.vercel.app' }, addEventListener: (name: string, fn: (event: any) => void) => listeners.set(name, fn) },
    caches: { open: async () => cache }, URL, fetch,
  });
  return {
    fetch, cache,
    request(url: string, method = 'GET') {
      let response: Promise<Response> | undefined;
      listeners.get('fetch')!({ request: new Request(url, { method }), respondWith: (value: Promise<Response>) => { response = value; } });
      return response;
    },
  };
}

describe('offline API data', () => {
  it.each(['https://gzw-data.dev', 'https://gzw-tools.vercel.app'])('caches %s API reads and restores the last response offline', async origin => {
    const sw = worker();
    const url = `${origin}/api/v1/vendor_stock?all=true`;
    sw.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ vendor: 'Handshake' }] })));
    expect((await sw.request(url))?.status).toBe(200);
    sw.fetch.mockRejectedValueOnce(new TypeError('offline'));
    expect(await (await sw.request(url))?.json()).toEqual({ data: [{ vendor: 'Handshake' }] });
  });

  it('does not cache unrelated origins or non-GET requests', () => {
    const sw = worker();
    expect(sw.request('https://unrelated.test/api/v1/weapons')).toBeUndefined();
    expect(sw.request('https://gzw-data.dev/api/v1/weapons', 'POST')).toBeUndefined();
    expect(sw.fetch).not.toHaveBeenCalled();
  });

  it('does not replace cached data with an HTTP error', async () => {
    const sw = worker();
    const url = 'https://gzw-data.dev/api/v1/tasks?all=true';
    sw.fetch.mockResolvedValueOnce(new Response('current'));
    await sw.request(url);
    sw.fetch.mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
    expect((await sw.request(url))?.status).toBe(503);
    sw.fetch.mockRejectedValueOnce(new TypeError('offline'));
    expect(await (await sw.request(url))?.text()).toBe('current');
  });

  it('returns a successful network response even when cache storage is full', async () => {
    const sw = worker();
    sw.cache.put.mockRejectedValueOnce(new Error('quota exceeded'));
    sw.fetch.mockResolvedValueOnce(new Response('current'));
    expect(await (await sw.request('https://gzw-data.dev/api/v1/tasks'))?.text()).toBe('current');
  });
});
