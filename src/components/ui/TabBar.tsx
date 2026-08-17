import { NavLink } from 'react-router-dom';
import { useRef, type KeyboardEvent } from 'react';

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
  const barRef = useRef<HTMLDivElement>(null);

  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern)
  const onKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(barRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    items[next].focus();
  };

  // NavLink mode (when no active/onChange)
  if (!('active' in props)) {
    const { tabs } = props as NavProps;
    return (
      <div ref={barRef} role="tablist" aria-label="Tools" onKeyDown={onKeyDown} className="tab-bar">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path || '/'}
            end={tab.path === '/'}
            role="tab"
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
    <div ref={barRef} role="tablist" aria-label="Tools" onKeyDown={onKeyDown} className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
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