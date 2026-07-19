import { useState } from 'react';
import RepCalculator from './components/RepCalculator';
import DollarCalculator from './components/DollarCalculator';
import MissionCalculator from './components/MissionCalculator';
import AmmoGuide from './components/AmmoGuide';
import ArmorGuide from './components/ArmorGuide';
import WeaponsGuide from './components/WeaponsGuide';
import TabBar from './components/ui/TabBar';
import { calcRepToDollars, VENDORS, formatNumber } from './lib/calc';
import './index.css';

type Tab = 'rep' | 'dollar' | 'missions' | 'ammo' | 'weapons' | 'armor';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'rep', label: 'Rep → $', icon: 'fas fa-bullseye' },
  { id: 'dollar', label: '$ → Rep', icon: 'fas fa-coins' },
  { id: 'missions', label: 'Missions', icon: 'fas fa-clipboard-list' },
  { id: 'ammo', label: 'Ammo', icon: 'fas fa-bolt' },
  { id: 'weapons', label: 'Weapons', icon: 'fas fa-crosshairs' },
  { id: 'armor', label: 'Armor', icon: 'fas fa-shield-halved' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('rep');
  const [repResult, setRepResult] = useState<ReturnType<typeof calcRepToDollars> | null>(null);

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
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-text-muted">
            {VENDORS.slice(0, 3).map((v) => (
              <span key={v.slug} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-drab" />
                <span className="text-text-muted">{v.name}</span>
                <span className="text-text/60">{formatNumber(v.rep)}</span>
                <span className="text-text-muted/40">/ {formatNumber(v.maxRep)}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="mt-5 card p-5 md:p-6">
          {activeTab === 'rep' && <RepCalculator result={repResult} setResult={setRepResult} />}
          {activeTab === 'dollar' && <DollarCalculator />}
          {activeTab === 'missions' && <MissionCalculator />}
          {activeTab === 'ammo' && <AmmoGuide />}
          {activeTab === 'weapons' && <WeaponsGuide />}
          {activeTab === 'armor' && <ArmorGuide />}
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
        </div>
      </footer>
    </div>
  );
}

export default App;
