import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: {
    (options: ToastOptions): void;
    (type: ToastType, title: string, message?: string, duration?: number): void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (...args: any[]) => {
      let type: ToastType = 'info';
      let title = '';
      let message: string | undefined = undefined;
      let duration: number = 4000;

      if (typeof args[0] === 'object' && args[0] !== null) {
        const opts = args[0] as ToastOptions;
        type = opts.type;
        title = opts.title;
        message = opts.message;
        if (typeof opts.duration === 'number') {
          duration = opts.duration;
        }
      } else {
        type = args[0];
        title = args[1];
        message = args[2];
        if (typeof args[3] === 'number') {
          duration = args[3];
        }
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast: showToast as any, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
