import { useState, useEffect } from 'react';

const API_BASE = 'https://gzw-data.vercel.app';

export default function ApiDocs() {
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setEndpoints(d?.data?.endpoints || []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-code text-accent text-sm" />
        <span className="section-title">GZW Data API</span>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Public REST API for Gray Zone Warfare game data. All endpoints return JSON with CORS headers.
      </p>

      <div className="space-y-2 mb-4">
        <a
          href={API_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <i className="fas fa-globe text-[10px]" />
          API Playground — {API_BASE}
        </a>
        <a
          href={`${API_BASE}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <i className="fas fa-book text-[10px]" />
          API Documentation — {API_BASE}/docs
        </a>
        <a
          href="https://github.com/ZoniBoy00/gzw-data"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-accent/80 hover:text-accent underline underline-offset-2"
        >
          <i className="fab fa-github text-[10px]" />
          GitHub Repository — github.com/ZoniBoy00/gzw-data
        </a>
      </div>

      {/* Endpoints */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <i className="fas fa-list text-accent/60 text-xs" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Available Endpoints</span>
          <span className="text-[9px] font-mono text-text-muted/50">{endpoints.length} total</span>
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
                className="text-[10px] font-mono text-text-muted/80 bg-surface-2 border border-border px-2.5 py-1.5 truncate hover:text-accent/80 hover:border-accent/20 transition-colors"
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
