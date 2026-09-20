import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import FaqModal from '../FaqModal';
import { GZW_API_BASE } from '../../lib/api';
import { useDataContext } from '../../lib/dataContext';

type NavItem = { id: string; label: string; icon: string; path: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operate',
    items: [
      { id: 'dashboard', label: 'Overview', icon: 'fas fa-gauge', path: '/' },
      { id: 'rep', label: 'Rep → $', icon: 'fas fa-bullseye', path: '/rep' },
      { id: 'dollar', label: '$ → Rep', icon: 'fas fa-coins', path: '/dollar' },
    ],
  },
  {
    label: 'Database',
    items: [
      { id: 'weapons', label: 'Weapons', icon: 'fas fa-crosshairs', path: '/weapons' },
      { id: 'ammo', label: 'Ammo', icon: 'fas fa-bolt', path: '/ammo' },
      { id: 'armor', label: 'Armor', icon: 'fas fa-shield-halved', path: '/armor' },
      { id: 'backpacks', label: 'Backpacks', icon: 'fas fa-box', path: '/backpacks' },
      { id: 'keys', label: 'Keys', icon: 'fas fa-key', path: '/keys' },
      { id: 'vendors', label: 'Vendors', icon: 'fas fa-store', path: '/vendors' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { id: 'missions', label: 'Missions', icon: 'fas fa-clipboard-list', path: '/missions' },
      { id: 'loadouts', label: 'Loadouts', icon: 'fas fa-screwdriver-wrench', path: '/loadouts' },
      { id: 'logs', label: 'Log Analyzer', icon: 'fas fa-file-lines', path: '/logs' },
    ],
  },
  {
    label: 'Resources',
    items: [{ id: 'api-docs', label: 'API Docs', icon: 'fas fa-code', path: '/api-docs' }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(group => group.items);

function StatsStrip() {
  const [stats, setStats] = useState<{ datasets: number; items: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${GZW_API_BASE}/stats`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Stats request failed: ${response.status}`);
        return response.json();
      })
      .then(body => {
        const data = body.data || body;
        const excluded = new Set(['armor_images', 'gzwtacmap_data', 'map_pois', 'weapon_images', 'item_images', 'vendor_images']);
        const entries = Object.entries(data).filter(([key]) => !excluded.has(key));
        const items = entries.reduce((sum, [, value]) => sum + ((value as { total?: number }).total || 0), 0);
        setStats({ datasets: entries.length, items });
      })
      .catch(error => {
        if (error.name !== 'AbortError') setStats(null);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="status-strip" aria-label="API status">
      <span className="status-strip__item"><span className="status-dot status-dot--good" />Live API</span>
      {stats && <span className="status-strip__item"><strong>{stats.datasets}</strong> datasets · <strong>{stats.items.toLocaleString()}</strong> records</span>}
      <span className="status-strip__item status-strip__muted">Read-only community data</span>
    </div>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="command-nav" aria-label="GZW Tools navigation">
      {NAV_GROUPS.map(group => (
        <div className="command-nav__group" key={group.label}>
          <div className="command-nav__label">{group.label}</div>
          {group.items.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              className={({ isActive }) => `command-nav__item${isActive ? ' is-active' : ''}`}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [showFaq, setShowFaq] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { dataVersion } = useDataContext();

  useEffect(() => {
    const specialTitles: Record<string, string> = {
      '/privacy': 'Privacy Policy',
      '/tos': 'Terms of Service',
    };
    const routeTitle = specialTitles[location.pathname] || ALL_ITEMS.find(item => item.path === location.pathname)?.label || 'Field Reference';
    document.title = `${routeTitle} · GZW Tools`;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className={`command-rail${menuOpen ? ' is-open' : ''}`}>
        <div className="command-rail__brand">
          <span className="brand-mark" aria-hidden="true"><i className="fas fa-crosshairs" /></span>
          <span className="brand-copy"><strong><em>GZW</em> Tools</strong><small>field reference / v2</small></span>
        </div>
        <Navigation onNavigate={() => setMenuOpen(false)} />
        <div className="command-rail__footer">
          <button className="shell-link" type="button" onClick={() => setShowFaq(true)}><i className="fas fa-circle-question" /> FAQ</button>
          <a className="shell-link" href="https://buymeacoffee.com/zoniboy00" target="_blank" rel="noopener noreferrer"><i className="fas fa-mug-hot" /> Support</a>
        </div>
      </aside>
      {menuOpen && <button className="rail-scrim" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <div className="app-shell__main">
        <header className="topbar">
          <button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <i className="fas fa-bars" aria-hidden="true" />
          </button>
          <div className="topbar__context"><span className="topbar__eyebrow">GZW Tools / Operations console</span><span className="topbar__title">Gray Zone Warfare field reference</span></div>
          <div className="topbar__actions"><span className="beta-tag">BETA</span><span className="data-tag"><i className="fas fa-database" /> {dataVersion ? `DATA ${dataVersion.slice(0, 10)}` : 'API v1'}</span></div>
        </header>
        <StatsStrip />
        <main id="main-content" className="app-content">{children}</main>
        <footer className="app-footer">
          <span>Community tool · not affiliated with M.A.G. Studios</span>
          <span><Link to="/privacy">Privacy</Link><Link to="/tos">Terms</Link><a href="https://github.com/ZoniBoy00/gzw-tools" target="_blank" rel="noopener noreferrer">GitHub</a></span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {ALL_ITEMS.slice(0, 4).map(item => <NavLink key={item.id} to={item.path} end={item.path === '/'} aria-label={item.label} className={({ isActive }) => isActive ? 'active' : undefined}><i className={item.icon} aria-hidden="true" /><span>{item.label}</span></NavLink>)}
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="More navigation"><i className="fas fa-ellipsis" aria-hidden="true" /><span>More</span></button>
      </nav>
      {showFaq && <FaqModal onClose={() => setShowFaq(false)} />}
    </div>
  );
}
