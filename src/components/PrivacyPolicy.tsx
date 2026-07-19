import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-shield-halved text-accent text-sm" />
        <span className="section-title">Privacy Policy</span>
      </div>

      <div className="space-y-4 text-sm text-text-muted leading-relaxed">
        <div className="border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text mb-2">Last updated: July 2026</p>
          <p>GZW Tools is a fan-made reference tool for the game Gray Zone Warfare. We take your privacy seriously.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Data Collection</h3>
          <p>GZW Tools does <strong>not</strong> collect, store, or transmit any personal data to any server. There are no analytics trackers, cookies (beyond what your browser may automatically set), or backend services that process your information.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Local Storage</h3>
          <p>Some features use your browser's <code className="text-accent">localStorage</code> to save preferences locally:</p>
          <ul className="list-disc list-inside mt-2 text-text-muted/90 space-y-1">
            <li>Vendor reputation values you enter</li>
            <li>Loadout builder configurations</li>
            <li>UI preferences</li>
          </ul>
          <p className="mt-2">This data never leaves your browser. You can clear it at any time via your browser settings.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Third-Party Services</h3>
          <p>This site is hosted on Vercel. Vercel may collect standard server logs (IP address, request timestamps) as part of their hosting service. We do not have access to these logs. The game data is sourced from the <a href="https://gray-zone-warfare.fandom.com/" target="_blank" rel="noopener noreferrer" className="text-accent/80 hover:text-accent">GZW Fandom Wiki</a>.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Contact</h3>
          <p>If you have questions about this policy, reach out via the GitHub repository where the source code is available.</p>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/" className="btn btn-outline btn-sm">
          <i className="fas fa-arrow-left" /> Back to Overview
        </Link>
      </div>
    </div>
  );
}
