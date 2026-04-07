// ============================================================
// ToastContainer.jsx — Toast notification stack
// ============================================================
// Renders a fixed top-right stack of toast notifications
// driven by useUIStore.toasts[]. Each toast auto-dismisses
// after its duration and can be manually dismissed.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/ui/
//   AR-02: state from Zustand stores
//   AR-09: styles consume tokens via ToastContainer.css
// ============================================================

import { useCallback } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react';

import { useUIStore } from '@/store/useUIStore.js';

import './ToastContainer.css';

/**
 * Get the icon component for a toast type.
 * @param {'info'|'success'|'warning'|'error'} type
 * @returns {JSX.Element}
 */
function getToastIcon(type) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="toast__icon" />;
    case 'warning':
      return <AlertTriangle className="toast__icon" />;
    case 'error':
      return <XCircle className="toast__icon" />;
    case 'info':
    default:
      return <Info className="toast__icon" />;
  }
}

/**
 * ToastContainer — Top-right toast notification stack.
 *
 * Reads from useUIStore.toasts and renders each toast
 * with auto-dismiss behavior (managed by useUIStore.addToast).
 */
function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  const handleDismiss = useCallback(
    (id) => {
      removeToast(id);
    },
    [removeToast]
  );

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type || 'info'}`}
          id={`toast-${toast.id}`}
          role="alert"
          aria-live="polite"
        >
          {getToastIcon(toast.type)}
          <div className="toast__content">
            <div className="toast__message">{toast.message}</div>
          </div>
          <button
            className="toast__dismiss"
            onClick={() => handleDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <X className="toast__dismiss-icon" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
