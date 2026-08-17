import { createContext } from 'react';

export type ToastType = 'success' | 'info' | 'error';

export const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});