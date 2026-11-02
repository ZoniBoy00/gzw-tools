import { parseLog } from './logparser';
import type { ParsedLog } from './logparser';

export type AnalysisMessage =
  | { type: 'progress'; percent: number }
  | { type: 'result'; result: ParsedLog }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<string | File>) => {
  try {
    const text = typeof event.data === 'string' ? event.data : await event.data.text();
    const result = parseLog(text, percent => self.postMessage({ type: 'progress', percent } satisfies AnalysisMessage));
    self.postMessage({ type: 'result', result } satisfies AnalysisMessage);
  } catch {
    self.postMessage({ type: 'error', message: 'Could not analyze this log. Please try again.' } satisfies AnalysisMessage);
  }
};
