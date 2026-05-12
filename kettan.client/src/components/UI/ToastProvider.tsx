import { createContext, useContext, type ReactNode } from 'react';
import { type AlertColor } from '@mui/material';

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider — Notifications disabled as per user request.
 * Interface maintained for code compatibility, but no-ops all calls.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (_msg: string, _sev: AlertColor = 'success') => {
    // NO-OP: Toast notifications are disabled
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
