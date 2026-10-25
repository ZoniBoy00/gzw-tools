import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchEvidence, fetchGuideArticles, fetchTaskGuides, splitParagraphs, wikiUrl } from '../lib/api';
import type { EvidenceItem, GuideArticle } from '../lib/api';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type GuideTab = 'systems' | 'tasks' | 'evidence';

interface GuideData {
  articles: GuideArticle[];
  taskGuides: GuideArticle[];
  evidence: EvidenceItem[];
  errors: string[];
}

const TABS: { id: GuideTab; label: string; icon: string }[] = [
  { id: 'systems', label: 'Hideout & Systems', icon: 'fas fa-house-chimney' },
  { id: 'tasks', label: 'Task Guides', icon: 'fas fa-route' },
  { id: 'evidence', label: 'Evidence', icon: 'fas fa-box-archive' },
];

function ArticleCard({ article, onOpen }: { article: GuideArticle; onOpen: (item: ModalItem) => void }) {
  const paragraphs = useMemo(() => splitParagraphs(article.content), [article.content]);
  const open = () => onOpen({
    name: article.name,
    image: article.image,
    type: 'guide',
    fields: [],
    text: paragraphs,
    link: { label: 'View on Wiki', url: wikiUrl(article.name) },
  });

  return (
    <article className="card p-3 flex flex-col gap-3 cursor-pointer hover:border-accent" onClick={open}>
      <div className="flex items-start gap-3">
        {article.image && (
          <img crossOrigin="anonymous"
            src={article.image}
            alt=""
            loading="lazy"
            className="w-16 h-16 shrink-0 object-cover border border-border bg-surface-2"
            onError={event => { event.currentTarget.hidden = true; }}
          />
        )}
        <h2 className="min-w-0 flex-1 text-base font-bold leading-tight">
          <button type="button" className="text-left hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${article.name} details`}>{article.name}</button>
        </h2>
      </div>
      {paragraphs[0] && <p className="line-clamp-3 text-xs leading-relaxed text-text-muted">{paragraphs[0]}</p>}
      <span className="mt-auto text-[10px] text-accent">{paragraphs.length > 1 ? 'Read more' : 'Details'}</span>
    </article>
  );
}

function EvidenceCard({ item, onOpen }: { item: EvidenceItem; onOpen: (item: ModalItem) => void }) {
  const open = () => onOpen({
    name: item.name,
    image: item.image,
    type: 'evidence',
    fields: [
      ...(item.sellPrice ? [{ label: 'Sell Price', value: item.sellPrice, desc: 'Price a trader pays for this item', color: 'text-accent' }] : []),
      ...(item.weight ? [{ label: 'Weight', value: item.weight, desc: 'Carry weight' }] : []),
      ...(item.gridSize ? [{ label: 'Grid Size', value: item.gridSize, desc: 'Inventory space' }] : []),
    ],
    link: { label: 'View on Wiki', url: wikiUrl(item.name) },
  });

  return (
    <article className="card p-3 flex items-start gap-3 cursor-pointer hover:border-accent" onClick={open}>
      {item.image && (
        <img crossOrigin="anonymous"
          src={item.image}
          alt=""
          loading="lazy"
          className="w-16 h-16 shrink-0 object-contain border border-border bg-surface-2"
          onError={event => { event.currentTarget.hidden = true; }}
        />
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold leading-tight">
          <button type="button" className="text-left hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${item.name} details`}>{item.name}</button>
        </h2>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-text-muted">
          {item.sellPrice && <div><dt className="inline">Sell </dt><dd className="inline text-accent">{item.sellPrice}</dd></div>}
          {item.weight && <div><dt className="inline">Weight </dt><dd className="inline">{item.weight}</dd></div>}
          {item.gridSize && <div><dt className="inline">Grid </dt><dd className="inline">{item.gridSize}</dd></div>}
        </dl>
      </div>
    </article>
  );
}

function failureReason(result: PromiseSettledResult<unknown>): string {
  if (result.status !== 'rejected') return '';
  return result.reason instanceof Error ? result.reason.message : String(result.reason);
}

export default function GameGuide() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: GuideTab = TABS.find(tab => tab.id === requestedTab)?.id ?? 'systems';
  const search = searchParams.get('search') || '';
  const [data, setData] = useState<GuideData | null>(null);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchGuideArticles(), fetchTaskGuides(), fetchEvidence()]).then(([articles, taskGuides, evidence]) => {
      if (cancelled) return;
      setData({
        articles: articles.status === 'fulfilled' ? articles.value : [],
        taskGuides: taskGuides.status === 'fulfilled' ? taskGuides.value : [],
        evidence: evidence.status === 'fulfilled' ? evidence.value : [],
        errors: [failureReason(articles), failureReason(taskGuides), failureReason(evidence)].filter(Boolean),
      });
    });
    return () => { cancelled = true; };
  }, []);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const setActiveTab = (tab: GuideTab) => setParam('tab', tab === 'systems' ? '' : tab);

  const query = search.trim().toLowerCase();
  const filteredArticles = useMemo(() => (data?.articles ?? []).filter(item => !query || `${item.name} ${item.content}`.toLowerCase().includes(query)), [data, query]);
  const filteredGuides = useMemo(() => (data?.taskGuides ?? []).filter(item => !query || `${item.name} ${item.content}`.toLowerCase().includes(query)), [data, query]);
  const filteredEvidence = useMemo(() => (data?.evidence ?? []).filter(item => !query || item.name.toLowerCase().includes(query)), [data, query]);

  const counts: Record<GuideTab, [number, number]> = {
    systems: [filteredArticles.length, data?.articles.length ?? 0],
    tasks: [filteredGuides.length, data?.taskGuides.length ?? 0],
    evidence: [filteredEvidence.length, data?.evidence.length ?? 0],
  };

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-book-open text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Game Guide</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        Hideout, experience, health, trading and other game systems, player task guides and evidence items.
      </p>

      <div className="tab-bar mb-3" role="tablist" aria-label="Game guide categories">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`${tab.icon} mr-2`} aria-hidden="true" />{tab.label} <span className="ml-1 font-mono text-[9px]">{counts[tab.id][1]}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <span className="sr-only">Search the game guide</span>
          <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={event => setParam('search', event.target.value)}
            placeholder="Search guides…"
            className="input input-sm pl-8"
            aria-label="Search guides"
          />
        </label>
        <span className="text-[9px] font-mono text-text-muted" aria-live="polite">{counts[activeTab][0]} / {counts[activeTab][1]}</span>
      </div>

      {!data ? (
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading game guide…</p></div>
      ) : (
        <>
          {data.errors.length > 0 && (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
              Some guide data could not be loaded: {data.errors.join(' · ')}
            </div>
          )}
          <section id={`${activeTab}-panel`} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
            {counts[activeTab][0] === 0 ? (
              <div className="empty-state"><i className="fas fa-book-open" aria-hidden="true" /><p>{counts[activeTab][1] ? 'Nothing matches your search.' : 'No records are available.'}</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {activeTab === 'systems' && filteredArticles.map(article => <ArticleCard key={article.id} article={article} onOpen={setModalItem} />)}
                {activeTab === 'tasks' && filteredGuides.map(article => <ArticleCard key={article.id} article={article} onOpen={setModalItem} />)}
                {activeTab === 'evidence' && filteredEvidence.map(item => <EvidenceCard key={item.id} item={item} onOpen={setModalItem} />)}
              </div>
            )}
          </section>
        </>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · text is taken from the community wiki and may lag behind the game.
      </div>
    </div>
  );
}
