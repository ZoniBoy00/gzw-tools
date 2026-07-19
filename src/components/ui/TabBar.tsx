interface Props<T extends string> {
  tabs: { id: T; label: string; icon?: string }[];
  active: T;
  onChange: (id: T) => void;
}

export default function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 bg-carbon-light/50 p-1 rounded-xl border border-carbon-border/50 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-shrink-0 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all tracking-wide ${
            active === tab.id
              ? 'bg-carbon-lighter text-white shadow-lg border border-carbon-border'
              : 'text-slate/50 hover:text-slate/80'
          }`}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
