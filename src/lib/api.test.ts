import { describe, expect, it } from 'vitest';
import { parsePen } from './api';

describe('ammo penetration mapping', () => {
  it('maps classes below the stopping class to penetration', () => {
    const m855 = parsePen('NIJ III+');

    expect(m855['III']).toBe(2);
    expect(m855['III+']).toBe(1);
    expect(m855['III++']).toBe(0);
    expect(m855['IV']).toBe(0);
  });

  it('marks the stopping class as magdump and stronger classes ineffective', () => {
    const m995 = parsePen('NIJ IV');

    expect(m995['III++']).toBe(2);
    expect(m995['IV']).toBe(1);
    expect(m995['IV+']).toBe(0);
  });

  it('returns ineffective results when the source value is missing or unknown', () => {
    expect(parsePen(undefined)['I']).toBe(0);
    expect(parsePen('NIJ unknown')['IV']).toBe(0);
  });
});
