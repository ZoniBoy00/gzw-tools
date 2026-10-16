import { describe, expect, it } from 'vitest';
import { decodeLoadout, encodeLoadout, loadoutShareUrl } from './loadoutShare';

const sample = { name: 'Night Ops ☾', weapons: ['AK-12', 'MP7'], vest: 'Crye JPC', helmet: 'Ops-Core', ammo: ['5.45x39mm PS'], notes: 'Quiet & fast' };

describe('loadout sharing', () => {
  it('round-trips a loadout including unicode', () => {
    expect(decodeLoadout(encodeLoadout(sample))).toEqual(sample);
  });

  it('produces a URL-safe string', () => {
    expect(encodeLoadout(sample)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(loadoutShareUrl(sample, 'https://example.test')).toMatch(/^https:\/\/example\.test\/loadouts\?loadout=[A-Za-z0-9_-]+$/);
  });

  it('rejects garbage and nameless payloads', () => {
    expect(decodeLoadout('not base64 !!')).toBeNull();
    expect(decodeLoadout(encodeLoadout({ ...sample, name: '  ' }))).toBeNull();
  });

  it('caps list sizes and ignores wrong types', () => {
    const many = encodeLoadout({ ...sample, weapons: Array.from({ length: 50 }, (_, i) => `W${i}`) });
    expect(decodeLoadout(many)?.weapons).toHaveLength(20);
    const odd = btoa(JSON.stringify({ n: 'X', w: 'nope', v: 5 })).replace(/=+$/, '');
    expect(decodeLoadout(odd)).toMatchObject({ name: 'X', weapons: [], vest: '' });
  });
});
