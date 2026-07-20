import { useEffect } from 'react';

export default function ApiDocs() {
  useEffect(() => {
    window.location.href = 'https://gzw-data.vercel.app';
  }, []);

  return (
    <div className="tab-content text-center py-12">
      <i className="fas fa-code text-accent text-3xl mb-4" />
      <h2 className="text-lg font-bold mb-2">API moved</h2>
      <p className="text-sm font-mono text-text-muted mb-4">
        The GZW game data API has moved to its own domain.
      </p>
      <a
        href="https://gzw-data.vercel.app"
        className="text-accent hover:underline underline-offset-2 font-mono text-sm"
      >
        gzw-data.vercel.app →
      </a>
    </div>
  );
}
