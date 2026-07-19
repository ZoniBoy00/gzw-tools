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

type Tab = 'rep' | 'dollar' | 'missions' | 'ammo' | 'armor' | 'weapons';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'rep', label: 'Rep → $', icon: '🎯' },
  { id: 'dollar', label: '$ → Rep', icon: '💰' },
  { id: 'missions', label: 'Missions', icon: '📋' },
  { id: 'ammo', label: 'Ammo', icon: '🔫' },
  { id: 'weapons', label: 'Weapons', icon: '🔧' },
  { id: 'armor', label: 'Armor', icon: '🛡️' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('rep');
  const [repResult, setRepResult] = useState<ReturnType<typeof calcRepToDollars> | null>(null);

  return (
    <div className="scanlines min-h-screen bg-carbon text-white flex items-start justify-center p-4">
      <div className="w-full max-w-2xl mt-6 mb-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest uppercase">
            <span className="text-3xl mr-3">⚔️</span>
            <span className="text-drab-light">GZW</span>{' '}
            <span className="text-white">Tools</span>
          </h1>
          <p className="text-slate/50 text-sm tracking-wide mt-2">
            Gray Zone Warfare — Tools & Reference
          </p>
          <VendorBar />
        </header>

        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <main className="mt-6 bg-carbon-light/30 border border-carbon-border/60 rounded-2xl p-5 shadow-2xl backdrop-blur">
          {activeTab === 'rep' && <RepCalculator result={repResult} setResult={setRepResult} />}
          {activeTab === 'dollar' && <DollarCalculator />}
          {activeTab === 'missions' && <MissionCalculator />}
          {activeTab === 'ammo' && <AmmoGuide />}
          {activeTab === 'weapons' && <WeaponsGuide />}
          {activeTab === 'armor' && <ArmorGuide />}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 space-y-1">
          <p className="text-[10px] text-slate/30 font-mono tracking-widest uppercase">
            Gray Zone Warfare · Fan Tool · Not affiliated with M.A.G. Studios
          </p>
          <p className="text-[11px] text-slate/40">
            Data from GZW Wiki · Built with React + TypeScript · Hosted on Vercel
          </p>
        </footer>
      </div>
    </div>
  );
}

function VendorBar() {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate/40">
      {VENDORS.map((v) => (
        <span key={v.slug} className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-drab/50" />
          {v.name}: <span className="text-slate/60">{formatNumber(v.rep)}</span>
          <span className="text-[9px] text-slate/40">/ {formatNumber(v.maxRep)}</span>
        </span>
      ))}
    </div>
  );
}

export default App;
