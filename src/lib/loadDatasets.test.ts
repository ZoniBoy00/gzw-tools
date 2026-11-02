import { describe, expect, it, vi } from 'vitest';
import { loadDatasets } from './loadDatasets';
describe('independent dataset loading', () => {
  it('publishes a successful dataset while another is pending and preserves it after failure', async () => {
    let reject!: (reason: Error) => void;
    const slow = new Promise<number>((_resolve, fail) => { reject = fail; });
    const success = vi.fn();
    const failure = vi.fn();
    const pending = loadDatasets({ weapons: async () => 42, ammo: () => slow }, success, failure);
    await Promise.resolve();
    expect(success).toHaveBeenCalledWith('weapons', 42);
    reject(new Error('Offline'));
    await pending;
    expect(failure).toHaveBeenCalledWith('ammo', 'Offline');
    expect(success).toHaveBeenCalledTimes(1);
  });
  it('can retry only failed loaders without refetching healthy data', async () => {
    const healthy = vi.fn(async () => 1);
    const broken = vi.fn<() => Promise<number>>().mockRejectedValueOnce('offline').mockResolvedValueOnce(2);
    const failures: Record<string, string> = {};
    const loaders = { healthy, broken };
    const success = vi.fn((name: string) => { delete failures[name]; });
    const failure = (name: string, message: string) => { failures[name] = message; };
    await loadDatasets(loaders, success, failure);
    expect(failures.broken).toBe('Failed to load data');
    await loadDatasets({ broken }, success, failure);
    expect(failures).toEqual({});
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(broken).toHaveBeenCalledTimes(2);
  });
});
