import { useEffect, useRef } from 'react';

const FAQS = [
  {
    q: 'What is GZW Tools?',
    a: 'A fan-made reference tool for Gray Zone Warfare. It helps you track missions, compare weapons and ammo, calculate reputation costs, and plan your loadouts — all in one place.',
  },
  {
    q: 'Is this official?',
    a: 'No. This is an unofficial fan project. We are not affiliated with, endorsed by, or connected to M.A.G. Studios. Gray Zone Warfare is a trademark of M.A.G. Studios.',
  },
  {
    q: 'Where does the data come from?',
    a: 'All game data is scraped from the GZW Fandom Wiki. Weapon stats, armor values, mission details, and vendor inventories are pulled automatically and updated weekly via GitHub Actions.',
  },
  {
    q: 'How accurate is the data?',
    a: 'Data is as accurate as the wiki allows. Some values (prices, stats) may change with game updates. The scraper runs weekly to keep things current. If you notice outdated info, check the wiki first — the tool follows whatever the wiki says.',
  },
  {
    q: 'How do vendor reputation levels work?',
    a: 'Each vendor has 4 reputation ranks. You need a certain amount of rep to unlock each rank. The formula is: Rank × 2,500 = rep needed. For example, R.2 requires 5,000 rep total. Enter your current rep in the Vendor Guide to see what items you have access to.',
  },
  {
    q: 'How does the Rep → $ calculator work?',
    a: 'It calculates how much money you need to spend to reach a target reputation. Enter your current rep, target rep, and your $/rep rate. The calculator shows the cost and progress visually.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Everything stays in your browser. We use localStorage to save your vendor rep values, loadout configurations, and calculator preferences. Nothing is sent to any server. See the Privacy Policy for details.',
  },
  {
    q: 'Can I contribute or report bugs?',
    a: 'Absolutely! The source code is on GitHub. Found a bug, want to request a feature, or improve the data? Open an issue or pull request. Links are in the footer.',
  },
];

interface Props {
  onClose: () => void;
}

export default function FaqModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Frequently Asked Questions"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="bg-surface border border-border w-full max-w-xl mx-3 max-h-[85vh] overflow-y-auto"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <i className="fas fa-circle-question text-accent text-sm" />
            <span className="section-title mb-0">FAQ</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text text-lg leading-none px-1"
            aria-label="Close"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        {/* FAQ Items */}
        <div className="p-4 space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group border border-border open:border-accent/30 transition-colors">
              <summary className="flex items-center gap-2 p-3 cursor-pointer text-sm font-medium text-text-muted group-open:text-accent hover:text-text transition-colors list-none">
                <i className="fas fa-chevron-right text-[8px] transition-transform group-open:rotate-90 text-accent/60" />
                {faq.q}
              </summary>
              <div className="px-3 pb-3 text-sm text-text-muted/90 leading-relaxed font-mono text-[11px]">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        {/* Close */}
        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="btn btn-outline w-full btn-sm">
            <i className="fas fa-xmark" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
