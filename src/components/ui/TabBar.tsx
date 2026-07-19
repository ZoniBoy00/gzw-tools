interface Props<T extends string> {
  tabs: { id: T; label: string; icon?: string }[];
  active: T;
  onChange: (id: T) => void;
}

export default function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab ${active === tab.id ? 'active' : ''}`}
        >
          {tab.icon && <i className={`${tab.icon} mr-1.5`} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
