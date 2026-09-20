import { useEffect, useRef, useState } from 'react';
import { fetchTaskWiki, wikiTaskUrl, type TaskWikiData } from '../lib/wiki';

export interface MissionTask {
  id: string;
  name: string;
  vendor: string;
  location: string;
  category?: string;
}

interface Props {
  task: MissionTask;
  onClose: () => void;
}

const CATEGORY_BADGES: Record<string, { label: string; cls: string }> = {
  hidden_task: { label: 'Hidden', cls: 'tag-amber' },
  main_task: { label: 'Main', cls: 'tag-main' },
  side_task: { label: 'Side', cls: 'tag-side' },
  squad_strike: { label: 'Squad', cls: 'tag-squad' },
  contract: { label: 'Contract', cls: 'tag-contract' },
};

export default function TaskModal({ task, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TaskWikiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  const toggleSection = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    fetchTaskWiki(task.name)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [task.name]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const badge = task.category ? CATEGORY_BADGES[task.category] : null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${task.name} mission details`}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border sticky top-0 bg-surface z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <i className="fas fa-clipboard-list text-accent text-sm" />
              <span className="section-title mb-0">{task.name}</span>
              {badge && <span className={`tag ${badge.cls} text-[8px]`}>{badge.label}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-text-muted flex-wrap">
              {task.vendor && <span className="tag tag-drab text-[9px]">{task.vendor}</span>}
              {task.location && <span className="truncate">{task.location}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text text-lg leading-none px-1 shrink-0"
            aria-label="Close"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error ? (
            <div className="error-message">
              <p className="mb-2">Could not load mission details from the wiki.</p>
              <a href={wikiTaskUrl(task.name)} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover underline">
                <i className="fas fa-external-link-alt text-[10px] mr-1" />Open on wiki instead
              </a>
            </div>
          ) : !data ? (
            <div className="loading-spinner">Loading mission details...</div>
          ) : (
            <>
              {/* Briefing */}
              {data.briefing && (
                <section>
                  <SectionTitle icon="fas fa-scroll" label="Briefing" />
                  <p className="text-xs font-mono text-text-muted/90 leading-relaxed border-l-2 border-accent/30 pl-3 italic">{data.briefing}</p>
                </section>
              )}

              {/* Objectives */}
              {data.objectives.length > 0 && (
                <section>
                  <SectionTitle icon="fas fa-bullseye" label="Objectives" />
                  <ul className="space-y-1.5">
                    {data.objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-mono text-text">
                        <i className="fas fa-check text-green mt-0.5 text-[10px]" aria-hidden="true" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Required items */}
              {data.requiredItems.length > 0 && (
                <section>
                  <SectionTitle icon="fas fa-box-open" label="Required Items" />
                  <div className="space-y-2">
                    {data.requiredItems.map((r, i) => (
                      <div key={i} className="border border-accent/25 bg-accent/5 p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-accent">{r.item}</span>
                          {r.amount && <span className="tag tag-amber text-[9px]">× {r.amount}</span>}
                        </div>
                        {r.notes && <p className="mt-1.5 text-[10px] font-mono text-text-muted/80 leading-relaxed">{r.notes}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Rewards */}
              {data.rewards.length > 0 && (
                <section>
                  <SectionTitle icon="fas fa-gift" label="Rewards" />
                  <ul className="space-y-1.5">
                    {data.rewards.map((r, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 text-xs font-mono ${r.level === 0 ? 'text-text' : 'text-text-muted/80 pl-5'}`}
                      >
                        <i
                          className={`${r.level === 0 ? 'fas fa-medal text-accent' : 'fas fa-angle-right text-text-muted/40'} mt-0.5 text-[10px]`}
                          aria-hidden="true"
                        />
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Guide sections with click-to-expand image previews */}
              {data.guideSections.length > 0 && (
                <section>
                  <SectionTitle icon="fas fa-map-pin" label="Visual Guides" />
                  <p className="text-[9px] font-mono text-text-muted/50 mb-2 -mt-1">Click a section to show its images</p>
                  <div className="space-y-2">
                    {data.guideSections.map((loc, i) => {
                      const open = openSections.has(i);
                      return (
                        <div key={i} className={`spawn-loc border p-3 transition-colors ${open ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-border-light'}`}>
                          <button
                            onClick={() => toggleSection(i)}
                            className="w-full text-left flex items-center justify-between gap-3"
                            aria-expanded={open}
                            aria-controls={`guide-section-${i}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <i className="fas fa-location-dot text-accent text-[10px]" aria-hidden="true" />
                              <span className="text-[11px] font-bold font-mono text-accent uppercase tracking-wider truncate">{loc.title}</span>
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-mono text-text-muted/50">{loc.images.length} img</span>
                              <i className={`fas fa-chevron-down text-[9px] text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </span>
                          </button>
                          {loc.text && <p className="mt-1.5 text-[10px] font-mono text-text-muted/80 leading-relaxed">{loc.text}</p>}
                          {loc.images.length > 0 && (
                            <div id={`guide-section-${i}`} className={`spawn-loc-preview ${open ? 'open' : ''}`}>
                              {loc.images.map((src, j) => (
                                <img key={j} src={src} alt={`${loc.title} image ${j + 1}`} loading="lazy" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Guide */}
              {data.guide && (
                <section>
                  <SectionTitle icon="fas fa-map" label="Guide" />
                  <p className="text-xs font-mono text-text-muted/90 leading-relaxed whitespace-pre-line">{data.guide}</p>
                </section>
              )}

              {/* Chain */}
              {(data.previous || data.next) && (
                <section>
                  <SectionTitle icon="fas fa-link" label="Mission Chain" />
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    {data.previous && (
                      <>
                        <span className="text-text-muted">Prev:</span>
                        <a href={wikiTaskUrl(data.previous)} target="_blank" rel="noopener noreferrer" className="text-accent/80 hover:text-accent">{data.previous}</a>
                      </>
                    )}
                    {data.previous && data.next && <span className="text-text-muted/30">→</span>}
                    {data.next && (
                      <>
                        <span className="text-text-muted">Next:</span>
                        <a href={wikiTaskUrl(data.next)} target="_blank" rel="noopener noreferrer" className="text-accent/80 hover:text-accent">{data.next}</a>
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2">
          <a href={wikiTaskUrl(task.name)} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex-1 btn-sm">
            <i className="fas fa-external-link-alt text-[10px]" /> View on Wiki
          </a>
          <button onClick={onClose} className="btn btn-primary flex-1 btn-sm">
            <i className="fas fa-xmark text-[10px]" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <i className={`${icon} text-accent/60 text-xs`} />
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</span>
    </div>
  );
}