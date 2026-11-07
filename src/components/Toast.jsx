import { useToastStore } from 'store';

// ADDED: Phase 1 — Toast notification component
// Stacked, auto-dismissing notifications in the top-right corner of the canvas area (mounted inside .app__canvas in App.jsx)
export default function Toast() {
  // ADDED: Stable selector per AR-14: returns undefined if no toasts, consuming component handles empty state
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.variant}`}>
          <div className="toast__message">{toast.message}</div>
          <button
            className="toast__dismiss"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
