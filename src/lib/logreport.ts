import type { ParsedLog } from './logparser';

export function serializeLogReport(parsed: ParsedLog, analyzedAt = new Date().toISOString()): string {
  return JSON.stringify({
    tool: 'GZW Tools Log Analyzer',
    analyzedAt,
    privacy: 'Generated locally in your browser from the provided log text.',
    summary: {
      session: parsed.sessionLabel,
      warnings: parsed.warnings,
      errors: parsed.errors,
      totalLines: parsed.totalLines,
      map: parsed.gameMap,
      region: parsed.region,
    },
    analysis: parsed,
  }, null, 2);
}

export function safeReportFilename(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return `${base || 'gzw-log-report'}.json`;
}
