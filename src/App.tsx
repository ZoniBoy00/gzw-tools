import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import Dashboard from './components/Dashboard';
import RepCalculator from './components/RepCalculator';
import DollarCalculator from './components/DollarCalculator';
import MissionFinder from './components/MissionFinder';
import AmmoGuide from './components/AmmoGuide';
import ArmorGuide from './components/ArmorGuide';
import WeaponsGuide from './components/WeaponsGuide';
import VendorGuide from './components/VendorGuide';
import LoadoutBuilder from './components/LoadoutBuilder';
import LogAnalyzer from './components/LogAnalyzer';
import KeysGuide from './components/KeysGuide';
import ApiDocs from './components/ApiDocs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import FaqModal from './components/FaqModal';
import TabBar from './components/ui/TabBar';
import './index.css';

/* Lazy load map (code splitting) */
const MapView = lazy(() => import('./components/MapView'));

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: 'fas fa-gauge', path: '/' },
  { id: 'rep', label: 'Rep → $', icon: 'fas fa-bullseye', path: '/rep' },
  { id: 'dollar', label: '$ → Rep', icon: 'fas fa-coins', path: '/dollar' },
  { id: 'missions', label: 'Missions', icon: 'fas fa-clipboard-list', path: '/missions' },
  { id: 'ammo', label: 'Ammo', icon: 'fas fa-bolt', path: '/ammo' },
  { id: 'weapons', label: 'Weapons', icon: 'fas fa-crosshairs', path: '/weapons' },
  { id: 'armor', label: 'Armor', icon: 'fas fa-shield-halved', path: '/armor' },
  { id: 'keys', label: 'Keys', icon: 'fas fa-key', path: '/keys' },
  { id: 'vendors', label: 'Vendors', icon: 'fas fa-store', path: '/vendors' },
  { id: 'loadouts', label: 'Loadouts', icon: 'fas fa-screwdriver-wrench', path: '/loadouts' },
  { id: 'logs', label: 'Log Analyzer', icon: 'fas fa-file-lines', path: '/logs' },
  { id: 'api-docs', label: 'API', icon: 'fas fa-code', path: '/api-docs' },
] as const;

/* ── Normal page layout (all tools) ── */
function NormalLayout() {
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="scanlines min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-accent/40 flex items-center justify-center">
              <i className="fas fa-crosshairs text-accent text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white">
                <span className="text-accent">GZW</span> Tools
              </h1>
              <p className="text-[10px] text-text-muted tracking-[0.1em] uppercase -mt-0.5">
                Gray Zone Warfare
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/map" className="text-text-muted/50 hover:text-accent transition-colors text-sm px-1" aria-label="Interactive Map" title="Interactive Map">
              <i className="fas fa-map" />
            </Link>
            <button onClick={() => setShowFaq(true)} className="text-text-muted/50 hover:text-accent transition-colors text-sm px-1" aria-label="FAQ">
              <i className="fas fa-circle-question" />
            </button>
            <span className="text-[9px] font-bold px-1.5 py-0.5 border border-accent/40 text-accent bg-accent/5 tracking-wider">BETA</span>
            <div className="ts-badge text-[9px]">
              <i className="fas fa-cloud-arrow-down" />
              <span>Data: Jul 2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <TabBar tabs={TABS} />

        {/* Content */}
        <div className="mt-5 card p-5 md:p-6 tab-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rep" element={<RepCalculator />} />
            <Route path="/dollar" element={<DollarCalculator />} />
            <Route path="/missions" element={<MissionFinder />} />
            <Route path="/ammo" element={<AmmoGuide />} />
            <Route path="/weapons" element={<WeaponsGuide />} />
            <Route path="/armor" element={<ArmorGuide />} />
            <Route path="/vendors" element={<VendorGuide />} />
            <Route path="/loadouts" element={<LoadoutBuilder />} />
            <Route path="/logs" element={<LogAnalyzer />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/keys" element={<KeysGuide />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/tos" element={<TermsOfService />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <p className="text-[10px] text-text-muted/40 font-mono tracking-[0.2em] uppercase">
            Gray Zone Warfare · Fan Tool · Not affiliated with M.A.G. Studios
          </p>
          <p className="text-[10px] text-text-muted/30 font-mono mt-1">
            Built with React + TypeScript · Data from GZW Wiki
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] font-mono">
            <Link to="/privacy" className="text-text-muted/40 hover:text-accent/70 transition-colors">Privacy Policy</Link>
            <span className="text-text-muted/20">·</span>
            <Link to="/tos" className="text-text-muted/40 hover:text-accent/70 transition-colors">Terms of Service</Link>
            <span className="text-text-muted/20">·</span>
            <a href="https://github.com/ZoniBoy00/gzw-tools" target="_blank" rel="noopener noreferrer" className="text-text-muted/40 hover:text-accent/70 transition-colors">
              <i className="fab fa-github mr-1" />GitHub
            </a>
          </div>
        </div>
      </footer>
      {showFaq && <FaqModal onClose={() => setShowFaq(false)} />}
    </div>
  );
}

/* ── Full-screen map layout ── */
function MapLayout() {
  return (
    <div className="h-screen bg-bg text-text flex flex-col overflow-hidden">
      {/* Minimal map header */}
      <header className="border-b border-border bg-surface z-50 shrink-0">
        <div className="px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 border border-accent/40 flex items-center justify-center">
                <i className="fas fa-crosshairs text-accent text-[10px]" />
              </div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white">
                <span className="text-accent">GZW</span> MAP
              </span>
            </Link>
            <span className="text-[7px] font-bold px-1 py-0.5 border border-accent/30 text-accent bg-accent/5 tracking-wider">TACTICAL</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-text-muted/40 hover:text-accent transition-colors text-[11px] flex items-center gap-1 font-mono">
              <i className="fas fa-arrow-left" /> Tools
            </Link>
          </div>
        </div>
      </header>
      {/* Full-screen map */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center bg-bg">
            <div className="text-center">
              <i className="fas fa-map text-accent text-2xl mb-3 opacity-50" />
              <div className="skeleton-text w-32 mx-auto" />
            </div>
          </div>
        }>
          <MapView />
        </Suspense>
      </div>
    </div>
  );
}

/* ── Router ── */
function AppRouter() {
  const location = useLocation();

  if (location.pathname === '/map') {
    return <MapLayout />;
  }

  return <NormalLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
