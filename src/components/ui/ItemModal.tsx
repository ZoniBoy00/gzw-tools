import { useEffect, useRef } from 'react';

export interface ModalItem {
  name: string;
  image?: string;
  fields: { label: string; value: string; color?: string; desc?: string }[];
  type: 'weapon' | 'vest' | 'helmet' | 'ammo' | 'medical' | 'gear' | 'attachment' | 'container' | 'tool';
}

interface Props {
  item: ModalItem;
  onClose: () => void;
}

const TYPE_ICONS = {
  weapon: 'fas fa-crosshairs',
  vest: 'fas fa-vest',
  helmet: 'fas fa-hard-hat',
  ammo: 'fas fa-bolt',
  medical: 'fas fa-kit-medical',
  gear: 'fas fa-box-open',
  attachment: 'fas fa-screwdriver-wrench',
  container: 'fas fa-box',
  tool: 'fas fa-toolbox',
};

export default function ItemModal({ item, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="bg-surface border border-border w-full max-w-lg mx-3 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <i className={`${TYPE_ICONS[item.type]} text-accent text-sm`} />
            <span className="section-title mb-0">{item.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text text-lg leading-none px-1"
            aria-label="Close"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        {/* Image */}
        {item.image && (
          <div className="flex justify-center p-4 bg-surface-2 border-b border-border">
            <img
              src={item.image}
              alt={item.name}
              className="max-h-48 object-contain"
            />
          </div>
        )}

        {/* Fields with tooltips */}
        <div className="p-4 space-y-2">
          {item.fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center text-sm font-mono py-1.5 border-b border-border/30">
              <span className="tooltip-item text-text-muted text-[11px] uppercase tracking-wider">
                {f.desc ? (
                  <>
                    {f.label}
                    <span className="tooltip-bubble">{f.desc}</span>
                  </>
                ) : (
                  f.label
                )}
              </span>
              <span className={`font-medium text-right ${f.color || 'text-text'}`}>{f.value}</span>
            </div>
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
