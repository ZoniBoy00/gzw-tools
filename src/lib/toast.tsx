import { useState, useCallback, type ReactNode } from 'react';
import { ToastContext, type ToastType } from './toast-context';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'fas fa-circle-check',
  info: 'fas fa-circle-info',
  error: 'fas fa-circle-exclamation',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={TOAST_ICONS[t.type]} aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}