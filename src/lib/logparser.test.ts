import { describe, expect, it } from 'vitest';
import { parseLog } from './logparser';

describe('log analysis progress', () => {
  it('reports monotonic progress across all lines, including blanks, without changing results', () => {
    const text = ['Log file open, 2026.10.26-20.32.46:025', ...Array<string>(2500).fill(''), '[2026.10.26-20.33.13:467][  0]LogProfile: Warning: Profile unavailable'].join('\n');
    const progress: number[] = [];
    const parsed = parseLog(text, value => progress.push(value));
    expect(parsed).toEqual(parseLog(text));
    expect(parsed.warnings).toBe(1);
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(100);
    expect(progress.some(value => value > 0 && value < 100)).toBe(true);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });
  it('completes empty input and small logs', () => {
    for (const text of ['', 'unrecognized line']) {
      const progress: number[] = [];
      parseLog(text, value => progress.push(value));
      expect(progress).toEqual([0, 100]);
    }
  });
});
