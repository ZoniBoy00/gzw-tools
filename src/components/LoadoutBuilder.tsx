import { useState } from 'react';
import TabBar from './ui/TabBar';
import { VESTS, HELMETS } from '../data/armor';
import { AMMO } from '../data/ammo';
import { WEAPONS } from '../data/weapons';
import { RECOMMENDATIONS } from '../data/armor';

// ─── Types ───

interface Loadout {
  id: string;
  name: string;
  weapons: string[];
  vest: string;
  helmet: string;
  ammo: string[];
  notes: string;
  createdAt: string;
}

const LS_KEY = 'gzw-loadouts';

function loadLoadouts(): Loadout[] {
  try {
    const d = localStorage.getItem(LS_KEY);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

function saveLoadouts(loadouts: Loadout[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(loadouts));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Consts ───

type SubTab = 'builder' | 'recommender';
const SUB: { id: SubTab; label: string; icon?: string }[] = [
  { id: 'builder', label: 'Build Loadout', icon: 'fas fa-screwdriver-wrench' },
  { id: 'recommender', label: 'Smart Recommender', icon: 'fas fa-wand-magic-sparkles' },
];

const PLAYSTYLES = [
  {
    id: 'assault',
    label: 'Assault',
    icon: 'fas fa-burst',
    desc: 'Heavy armor, high-penetration ammo, assault rifles',
    armorFocus: ['III+', 'III++'],
    ammoPreference: (a: typeof AMMO[0]) => a.pen['III'] >= 2 || a.pen['III+'] >= 2,
  },
  {
    id: 'defense',
    label: 'Defense',
    icon: 'fas fa-shield-halved',
    desc: 'Balanced protection, medium armor, versatile ammo',
    armorFocus: ['III'],
    ammoPreference: (a: typeof AMMO[0]) => a.pen['III'] >= 1,
  },
  {
    id: 'stealth',
    label: 'Stealth',
    icon: 'fas fa-eye-slash',
    desc: 'Light armor, subsonic ammo, SMGs and pistols',
    armorFocus: ['IIIA', 'IIIA+'],
    ammoPreference: (a: typeof AMMO[0]) => a.subsonic || a.caliber === '9x19mm' || a.caliber === '4.6x30mm' || a.caliber === '.45 ACP',
  },
];

const BUDGETS = [
  { id: 'budget', label: 'Budget ($)', icon: 'fas fa-dollar-sign', tier: 'T1' },
  { id: 'mid', label: 'Mid ($$)', icon: 'fas fa-coins', tier: 'T2' },
  { id: 'high', label: 'High ($$$)', icon: 'fas fa-crown', tier: 'T3' },
  { id: 'endgame', label: 'End Game ($$$$)', icon: 'fas fa-star', tier: 'T4' },
];

// ─── Component ───

export default function LoadoutBuilder() {
  const [tab, setTab] = useState<SubTab>('builder');

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-screwdriver-wrench text-accent text-sm" />
        <span className="section-title">Loadouts</span>
      </div>

      <TabBar tabs={SUB} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'builder' && <Builder />}
        {tab === 'recommender' && <Recommender />}
      </div>
    </div>
  );
}

// ─── Builder ───

function Builder() {
  const [loadouts, setLoadouts] = useState<Loadout[]>(loadLoadouts);
  const [editing, setEditing] = useState<Loadout | null>(null);
  const [name, setName] = useState('');
  const [weaponSearch, setWeaponSearch] = useState('');
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedVest, setSelectedVest] = useState('');
  const [selectedHelmet, setSelectedHelmet] = useState('');
  const [selectedAmmo, setSelectedAmmo] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Filter weapons
  const filteredWeapons = weaponSearch.trim()
    ? WEAPONS.filter((w) => w.name.toLowerCase().includes(weaponSearch.toLowerCase()) || w.caliber.toLowerCase().includes(weaponSearch.toLowerCase()))
    : WEAPONS;

  const resetForm = () => {
    setName('');
    setWeaponSearch('');
    setSelectedWeapons([]);
    setSelectedVest('');
    setSelectedHelmet('');
    setSelectedAmmo([]);
    setNotes('');
    setEditing(null);
    setShowForm(false);
  };

  const save = () => {
    if (!name.trim()) return;
    if (editing) {
      const updated = loadouts.map((l) =>
        l.id === editing.id
          ? { ...l, name, weapons: selectedWeapons, vest: selectedVest, helmet: selectedHelmet, ammo: selectedAmmo, notes }
          : l,
      );
      setLoadouts(updated);
      saveLoadouts(updated);
    } else {
      const newLoadout: Loadout = {
        id: genId(),
        name,
        weapons: selectedWeapons,
        vest: selectedVest,
        helmet: selectedHelmet,
        ammo: selectedAmmo,
        notes,
        createdAt: new Date().toISOString(),
      };
      const updated = [...loadouts, newLoadout];
      setLoadouts(updated);
      saveLoadouts(updated);
    }
    resetForm();
  };

  const edit = (l: Loadout) => {
    setEditing(l);
    setName(l.name);
    setSelectedWeapons(l.weapons);
    setSelectedVest(l.vest);
    setSelectedHelmet(l.helmet);
    setSelectedAmmo(l.ammo);
    setNotes(l.notes);
    setShowForm(true);
  };

  const remove = (id: string) => {
    const updated = loadouts.filter((l) => l.id !== id);
    setLoadouts(updated);
    saveLoadouts(updated);
  };

  const toggleWeapon = (name: string) => {
    setSelectedWeapons((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
  };

  const toggleAmmo = (name: string) => {
    setSelectedAmmo((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
  };

  return (
    <div>
      {/* Saved loadouts */}
      {loadouts.length > 0 && (
        <div className="mb-5 space-y-1.5 animate-stagger">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
            <i className="fas fa-box-archive text-accent/60" />
            Saved Loadouts ({loadouts.length})
          </div>
          {loadouts.map((l) => (
            <div key={l.id} className="card card-highlight p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">
                  {l.weapons.length} weapon{l.weapons.length !== 1 ? 's' : ''}
                  {l.vest && ` · ${l.vest.slice(0, 24)}${l.vest.length > 24 ? '…' : ''}`}
                  {l.helmet && ` · ${l.helmet.slice(0, 20)}`}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => edit(l)} className="text-text-muted hover:text-accent text-xs px-1.5 py-1" aria-label={`Edit ${l.name}`}>
                  <i className="fas fa-pen-to-square" />
                </button>
                <button onClick={() => remove(l.id)} className="text-text-muted hover:text-red text-xs px-1.5 py-1" aria-label={`Delete ${l.name}`}>
                  <i className="fas fa-trash-can" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New / Edit button */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn btn-outline w-full">
          <i className="fas fa-plus" /> {loadouts.length > 0 ? 'New Loadout' : 'Create Your First Loadout'}
        </button>
      ) : (
        /* Build form */
        <div className="border border-accent/20 bg-accent/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
              <i className="fas fa-pen-ruler mr-1" />
              {editing ? 'Edit Loadout' : 'New Loadout'}
            </span>
            <button onClick={resetForm} className="text-[10px] text-text-muted hover:text-text font-mono">Cancel</button>
          </div>

          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Loadout name (e.g. 'Night Ops')"
            className="input mb-3"
            aria-label="Loadout name"
          />

          {/* Weapons */}
          <div className="mb-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5 block">
              <i className="fas fa-crosshairs text-accent/60 mr-1" />Weapons
            </label>
            <input
              type="text"
              value={weaponSearch}
              onChange={(e) => setWeaponSearch(e.target.value)}
              placeholder="Search weapons..."
              className="input input-sm mb-1.5"
              aria-label="Search weapons to add"
            />
            <div className="max-h-32 overflow-y-auto space-y-0.5 border border-border p-1.5 bg-surface-2">
              {filteredWeapons.slice(0, 30).map((w) => (
                <button
                  key={w.name}
                  onClick={() => toggleWeapon(w.name)}
                  className={`block w-full text-left text-[11px] font-mono px-2 py-1 transition-colors ${
                    selectedWeapons.includes(w.name)
                      ? 'bg-accent/10 text-accent border-l-2 border-accent'
                      : 'text-text-muted hover:text-text hover:bg-surface-3 border-l-2 border-transparent'
                  }`}
                >
                  {w.name}
                  <span className="text-[9px] text-text-muted/50 ml-2">{w.type} · {w.caliber}</span>
                </button>
              ))}
              {filteredWeapons.length === 0 && <div className="text-[10px] text-text-muted py-2 text-center">No weapons match</div>}
            </div>
            {selectedWeapons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedWeapons.map((n) => (
                  <span key={n} className="chip chip-sm active" onClick={() => toggleWeapon(n)}>
                    {n} <i className="fas fa-xmark text-[8px] ml-1" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Vest + Helmet */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5 block">
                <i className="fas fa-vest text-accent/60 mr-1" />Vest
              </label>
              <select value={selectedVest} onChange={(e) => setSelectedVest(e.target.value)} className="input input-sm" aria-label="Select vest">
                <option value="">— None —</option>
                {VESTS.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.nij})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5 block">
                <i className="fas fa-hard-hat text-accent/60 mr-1" />Helmet
              </label>
              <select value={selectedHelmet} onChange={(e) => setSelectedHelmet(e.target.value)} className="input input-sm" aria-label="Select helmet">
                <option value="">— None —</option>
                {HELMETS.map((h) => (
                  <option key={h.name} value={h.name}>{h.name} ({h.nij})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ammo */}
          <div className="mb-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5 block">
              <i className="fas fa-bolt text-accent/60 mr-1" />Ammunition
            </label>
            <div className="max-h-24 overflow-y-auto space-y-0.5 border border-border p-1.5 bg-surface-2">
              {AMMO.filter((a, i, arr) => arr.findIndex((x) => x.name === a.name) === i).slice(0, 20).map((a) => (
                <button
                  key={a.name}
                  onClick={() => toggleAmmo(a.name)}
                  className={`block w-full text-left text-[11px] font-mono px-2 py-0.5 transition-colors ${
                    selectedAmmo.includes(a.name)
                      ? 'bg-accent/10 text-accent border-l-2 border-accent'
                      : 'text-text-muted hover:text-text hover:bg-surface-3 border-l-2 border-transparent'
                  }`}
                >
                  {a.name}
                  <span className="text-[9px] text-text-muted/50 ml-2">{a.caliber}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="input input-sm mb-3 resize-none"
            rows={2}
            aria-label="Loadout notes"
          />

          <button onClick={save} className="btn btn-primary w-full btn-sm" disabled={!name.trim()}>
            <i className="fas fa-floppy-disk" /> {editing ? 'Update Loadout' : 'Save Loadout'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Recommender ───

function Recommender() {
  const [budget, setBudget] = useState<string | null>(null);
  const [playstyle, setPlaystyle] = useState<string | null>(null);
  const [step, setStep] = useState<'budget' | 'playstyle' | 'result'>('budget');

  const reset = () => {
    setBudget(null);
    setPlaystyle(null);
    setStep('budget');
  };

  const selectedBudget = BUDGETS.find((b) => b.id === budget);
  const selectedStyle = PLAYSTYLES.find((p) => p.id === playstyle);

  const recommendation = budget && playstyle
    ? RECOMMENDATIONS.find((r) => r.tier === selectedBudget?.tier)
    : null;

  // Filter ammo based on playstyle
  const recommendedAmmo = playstyle
    ? AMMO.filter((a) => {
        const style = PLAYSTYLES.find((p) => p.id === playstyle);
        if (!style) return false;
        return style.ammoPreference(a);
      }).slice(0, 5)
    : [];

  // Filter weapons based on playstyle
  const recommendedWeapons = playstyle
    ? WEAPONS.filter((w) => {
        if (playstyle === 'stealth') return w.type === 'SMG' || w.type === 'Pistol';
        if (playstyle === 'assault') return w.type === 'Assault Rifle' || w.type === 'DMR';
        return true;
      }).slice(0, 5)
    : [];

  return (
    <div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-4">
        {['budget', 'playstyle', 'result'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 border transition-colors ${
                step === s
                  ? 'border-accent text-accent bg-accent/5'
                  : ['budget', 'playstyle'].includes(step) && i < ['budget', 'playstyle', 'result'].indexOf(step)
                    ? 'border-green text-green bg-green/5'
                    : 'border-border text-text-muted'
              }`}
            >
              {i + 1}. {s === 'budget' ? 'Budget' : s === 'playstyle' ? 'Playstyle' : 'Result'}
            </span>
            {i < 2 && <span className="text-text-muted/30 text-[10px]"><i className="fas fa-chevron-right" /></span>}
          </div>
        ))}
      </div>

      {/* Step 1: Budget */}
      {step === 'budget' && (
        <div>
          <p className="text-xs font-mono text-text-muted mb-3">Choose your in-game budget tier:</p>
          <div className="grid grid-cols-2 gap-2 animate-stagger">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                onClick={() => { setBudget(b.id); setStep('playstyle'); }}
                className={`card card-highlight p-4 text-left transition-all ${
                  budget === b.id ? 'border-accent/50 bg-accent/5' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <i className={`${b.icon} ${budget === b.id ? 'text-accent' : 'text-text-muted'} text-sm`} />
                  <span className="font-bold text-sm">{b.label}</span>
                </div>
                <div className="text-[10px] font-mono text-text-muted">
                  {b.id === 'budget' && 'Best value, AI-focused'}
                  {b.id === 'mid' && 'Balanced vs players'}
                  {b.id === 'high' && 'Premium gear'}
                  {b.id === 'endgame' && 'Best-in-slot'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Playstyle */}
      {step === 'playstyle' && (
        <div>
          <p className="text-xs font-mono text-text-muted mb-3">Choose your playstyle:</p>
          <div className="grid grid-cols-1 gap-2 animate-stagger">
            {PLAYSTYLES.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPlaystyle(p.id); setStep('result'); }}
                className={`card card-highlight p-4 text-left transition-all ${
                  playstyle === p.id ? 'border-accent/50 bg-accent/5' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <i className={`${p.icon} ${playstyle === p.id ? 'text-accent' : 'text-text-muted'} text-sm`} />
                  <span className="font-bold text-sm">{p.label}</span>
                  <span className="text-[10px] font-mono text-text-muted ml-2">{p.desc}</span>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('budget')} className="text-[10px] text-text-muted hover:text-accent mt-3 font-mono">
            <i className="fas fa-arrow-left mr-1" /> Back to budget
          </button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && selectedBudget && selectedStyle && (
        <div className="animate-stagger">
          {/* Summary */}
          <div className="flex gap-2 mb-4 text-[10px] font-mono text-text-muted">
            <span className="chip active">{selectedBudget.label}</span>
            <span className="chip active">{selectedStyle.label}</span>
          </div>

          {/* Gear recommendation */}
          {recommendation ? (
            <div className="card card-highlight p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="tag tag-amber">{recommendation.tier}</span>
                <span className="text-sm font-bold">{recommendation.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-surface-2 p-2 border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">
                    <i className="fas fa-vest text-accent/60 mr-1" />Vest
                  </div>
                  {recommendation.vest}
                </div>
                <div className="bg-surface-2 p-2 border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">
                    <i className="fas fa-hard-hat text-accent/60 mr-1" />Helmet
                  </div>
                  {recommendation.helmet}
                </div>
                <div className="bg-surface-2 p-2 border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">
                    <i className="fas fa-bolt text-accent/60 mr-1" />Ammo
                  </div>
                  {recommendation.ammo.join(', ')}
                </div>
              </div>
              <p className="mt-2 text-[11px] font-mono text-text-muted/80 italic">— {recommendation.notes}</p>
            </div>
          ) : (
            <div className="empty-state mb-4">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              <p>No recommendation for this combination</p>
            </div>
          )}

          {/* Recommended weapons */}
          <div className="mb-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
              <i className="fas fa-crosshairs text-accent/60" />
              Recommended Weapons
            </div>
            <div className="space-y-1">
              {recommendedWeapons.map((w) => (
                <div key={w.name} className="flex items-center justify-between bg-surface-2 border border-border p-2.5">
                  <div>
                    <span className="text-xs font-medium">{w.name}</span>
                    <span className="text-[10px] text-text-muted ml-2">{w.type}</span>
                  </div>
                  <span className="text-[10px] font-mono text-accent">{w.caliber} · {w.magSize}rds</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended ammo */}
          <div className="mb-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
              <i className="fas fa-bolt text-accent/60" />
              Recommended Ammunition
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recommendedAmmo.map((a) => (
                <span key={a.name} className="chip chip-sm active">
                  {a.name}
                  <span className="text-text-muted ml-1">{a.caliber}</span>
                </span>
              ))}
              {recommendedAmmo.length === 0 && (
                <span className="text-[10px] text-text-muted font-mono">No specific ammo suggestions</span>
              )}
            </div>
          </div>

          {/* Playstyle insight */}
          <div className="border border-border p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-circle-info text-accent/60 text-[10px]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Why this loadout?</span>
            </div>
            <p className="text-[11px] font-mono text-text-muted/80 leading-relaxed">
              {selectedStyle.id === 'assault' && 'Assault builds prioritize stopping power. Heavy ceramic plates stop rifle rounds, while AP ammo ensures you can penetrate any armor. Assault rifles and DMRs give you the range and firepower to win engagements.'}
              {selectedStyle.id === 'defense' && 'Defense builds balance protection and mobility. UHMWPE and steel plates offer good protection without the weight of ceramic. Versatile ammo like M855 or BP 7N23 handles both AI and players effectively.'}
              {selectedStyle.id === 'stealth' && 'Stealth builds favor lightweight gear and quiet ammunition. Subsonic rounds keep you off the minimap, SMGs and pistols allow fast movement. Aramid armor stops pistol rounds while keeping you agile.'}
            </p>
          </div>

          <button onClick={reset} className="btn btn-outline btn-sm w-full">
            <i className="fas fa-arrow-left" /> Start Over
          </button>
        </div>
      )}
    </div>
  );
}
