import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import MissionFinder from './MissionFinder';
import SiteSearchDialog from './SiteSearchDialog';
import { VENDORS } from '../lib/calc';

const sources = vi.hoisted(() => Object.fromEntries(
  ['tasks', 'main_task', 'side_task', 'hidden_task', 'squad_strike_missions', 'contract'].map(name => [
    name, Array.from({ length: 51 }, (_, index) => ({
      id: `${name}-${index}`, name: `${name} mission ${index + 1}`, vendor: 'Handshake', location: 'Test region',
    })),
  ]),
));

vi.mock('../hooks/useApiData', () => ({
  useApiData: (endpoint: string) => {
    const url = new URL(endpoint, 'https://example.test/');
    const records = sources[url.pathname.slice(1)] ?? [];
    return { data: url.searchParams.get('all') === 'true' ? records : records.slice(0, 50), loading: false };
  },
}));

afterEach(() => vi.unstubAllGlobals());

describe('complete mission datasets', () => {
  it('shows missions beyond the default API page in every task source', () => {
    vi.stubGlobal('window', { location: { search: '' } });
    const html = renderToStaticMarkup(<MissionFinder />);
    for (const name of Object.keys(sources)) expect(html).toContain(`${name} mission 51`);
  });

  it('indexes every task source beyond the default page for site search', () => {
    const html = renderToStaticMarkup(<MemoryRouter><SiteSearchDialog open onClose={() => {}} /></MemoryRouter>);
    const text = html.replace(/<!--[\s\S]*?-->/g, '');
    expect(text).toContain(`${6 * 51 + VENDORS.length} indexed records`);
  });
});
