import { useEffect, useRef, useState } from 'react';
import type { ParsedLog } from '../lib/logparser';
import type { AnalysisMessage } from '../lib/logAnalysisWorker';

export function useLogAnalysis() {
  const workerRef = useRef<Worker | null>(null);
  const [parsed, setParsed] = useState<ParsedLog | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { workerRef.current?.terminate(); }, []);

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setAnalyzing(false);
    setParsed(null);
    setProgress(null);
    setError(null);
  };

  const analyze = (input: string | File) => {
    cancel();
    setAnalyzing(true);
    let worker: Worker;
    const fail = (message: string) => {
      if (workerRef.current !== worker) return;
      setError(message);
      setAnalyzing(false);
      worker.terminate();
      workerRef.current = null;
    };
    try {
      worker = new Worker(new URL('../lib/logAnalysisWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<AnalysisMessage>) => {
        if (workerRef.current !== worker) return;
        const message = event.data;
        if (message.type === 'progress') setProgress(message.percent);
        else if (message.type === 'error') fail(message.message);
        else {
          setParsed(message.result);
          setProgress(100);
          setAnalyzing(false);
          worker.terminate();
          workerRef.current = null;
        }
      };
      worker.onerror = () => fail('Log analysis failed. Please try again.');
      worker.onmessageerror = () => fail('The analysis result could not be read. Please try again.');
      worker.postMessage(input);
    } catch {
      workerRef.current?.terminate();
      workerRef.current = null;
      setError('Could not start log analysis. Please try again.');
      setAnalyzing(false);
    }
  };

  return { parsed, analyzing, progress, error, analyze, cancel };
}
