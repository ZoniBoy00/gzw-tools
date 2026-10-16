import { useState, useEffect } from 'react';
import { fetchApiRoot, GZW_API_BASE, gzwClient } from '../lib/api';

export default function ApiDocs() {
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetchApiRoot(gzwClient, controller.signal)
      .then(response => {
        if (cancelled) return;
        setEndpoints(response.endpoints);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!cancelled && !(cause instanceof Error && cause.name === 'AbortError')) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-code text-accent text-sm" />
        <h1 className="section-title">GZW Data API</h1>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Public REST API for Gray Zone Warfare game data. All endpoints return JSON with CORS headers.
      </p>

      <div className="space-y-2 mb-4">
        <a
          href={GZW_API_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <i className="fas fa-globe text-[10px]" />
          API Playground — {GZW_API_BASE}
        </a>
        <a
          href="https://gzw-data.dev/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <i className="fas fa-book text-[10px]" />
          API Documentation — gzw-data.dev/docs
        </a>
        <a
          href="https://github.com/ZoniBoy00/gzw-data"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <svg className="h-[10px] w-[10px] fill-current" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
          GitHub Repository — github.com/ZoniBoy00/gzw-data
        </a>
      </div>

      {/* Endpoints */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <i className="fas fa-list text-accent/60 text-xs" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Available Endpoints</span>
          <span className="text-[9px] font-mono text-text-muted">{endpoints.length} total</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <i className="fas fa-spinner fa-spin" />
            <p>Loading endpoints...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
            {endpoints.map((ep) => (
              <div
                key={ep}
                className="text-[10px] font-mono text-text-muted bg-surface-2 border border-border px-2.5 py-1.5 truncate hover:text-accent/80 hover:border-accent/20 transition-colors"
              >
                <span className="text-green/70 font-bold mr-1">/api/</span>{ep}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border border-border p-3">
        <div className="flex items-center gap-2 mb-1">
          <i className="fas fa-sync text-accent/60 text-[10px]" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-text-muted">Auto-Updated Weekly</span>
        </div>
        <p className="text-[10px] font-mono text-text-muted/70 leading-relaxed">
          This API is automatically updated every week with the latest data scraped from the
          {' '}<a href="https://gray-zone-warfare.fandom.com/wiki/Gray_Zone_Warfare_Wiki" target="_blank" rel="noopener noreferrer" className="text-accent/70 hover:text-accent underline underline-offset-2">Gray Zone Warfare Wiki</a>.
          Data is refreshed, deduplicated, and normalized during each update cycle.
        </p>
      </div>
    </div>
  );
}
