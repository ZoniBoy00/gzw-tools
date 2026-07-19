import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-file-contract text-accent text-sm" />
        <span className="section-title">Terms of Service</span>
      </div>

      <div className="space-y-4 text-sm text-text-muted leading-relaxed">
        <div className="border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text mb-2">Last updated: July 2026</p>
          <p>By using GZW Tools you agree to these terms. If you do not agree, do not use this site.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Fan Project</h3>
          <p>GZW Tools is an unofficial fan-made project. It is <strong>not affiliated with, endorsed by, or connected to</strong> M.A.G. Studios or any of their partners. Gray Zone Warfare is a registered trademark of M.A.G. Studios. All game-related content, images, and data are property of their respective owners.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Use at Your Own Risk</h3>
          <p>This tool is provided "as is" without any warranty, express or implied. We make no guarantees about the accuracy, completeness, or timeliness of the data displayed. Game mechanics and values may change with updates, and data may become outdated.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">No Liability</h3>
          <p>We are not liable for any damages, losses, or issues arising from your use of this tool. Decisions made based on data from this tool are entirely your own responsibility.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Data Source</h3>
          <p>All game data is sourced from the <a href="https://gray-zone-warfare.fandom.com/" target="_blank" rel="noopener noreferrer" className="text-accent/80 hover:text-accent">GZW Fandom Wiki</a>, which is community-maintained and licensed under CC-BY-SA. Some information may be incomplete or inaccurate.</p>
        </div>

        <div className="border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Changes</h3>
          <p>We reserve the right to update these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.</p>
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
