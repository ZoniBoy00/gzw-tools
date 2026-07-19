import { NavLink } from 'react-router-dom';

type TabItem = { id: string; label: string; icon?: string; path?: string };

interface NavProps {
  tabs: readonly TabItem[];
  /** If set, uses NavLink routing. Otherwise uses button+onChange */
  active?: never;
  onChange?: never;
}

interface SelectorProps<T extends string> {
  tabs: readonly { id: T; label: string; icon?: string; path?: never }[];
  active: T;
  onChange: (id: T) => void;
}

type Props<T extends string> = NavProps | SelectorProps<T>;

export default function TabBar<T extends string>(props: Props<T>) {
  // NavLink mode (when no active/onChange)
  if (!('active' in props)) {
    const { tabs } = props as NavProps;
    return (
      <div className="tab-bar">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path || '/'}
            end={tab.path === '/'}
            className={({ isActive }: { isActive: boolean }) => `tab ${isActive ? 'active' : ''}`}
          >
            {tab.icon && <i className={`${tab.icon} mr-1.5`} />}
            {tab.label}
          </NavLink>
        ))}
      </div>
    );
  }

  // Selector mode (active + onChange)
  const { tabs, active, onChange } = props as SelectorProps<T>;
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
