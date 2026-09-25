import { describe, expect, it } from 'vitest';
import { parseLog } from './logparser';
import { safeReportFilename, serializeLogReport } from './logreport';

describe('log analyzer report', () => {
  it('serializes locally analyzed data with an explicit privacy note', () => {
    const report = JSON.parse(serializeLogReport(parseLog('Log file open, 2026.09.25-10.00.00:000'), '2026-09-25T10:01:00.000Z'));
    expect(report.tool).toBe('GZW Tools Log Analyzer');
    expect(report.analyzedAt).toBe('2026-09-25T10:01:00.000Z');
    expect(report.privacy).toContain('locally in your browser');
    expect(report.analysis.totalLines).toBe(1);
  });

  it('creates a safe JSON filename from a user-provided log name', () => {
    expect(safeReportFilename('../../GZW log!.log')).toBe('GZW-log.json');
    expect(safeReportFilename('...')).toBe('gzw-log-report.json');
  });
});
