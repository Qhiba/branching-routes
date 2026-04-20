import { create } from 'zustand';
import { generateId } from 'utils/uuid';

// ADDED: Phase 1 — Toast state management
// Ephemeral store for user notifications; never persisted to IndexedDB
const timeoutMap = new Map(); // Module-level: tracks setTimeout handles per toast

export const useToastStore = create((set) => ({
  // ADDED: Initial state — empty toasts array (AR-14 compliance: never returns new [] literal)
  toasts: [],

  // ADDED: Add a toast with auto-dismiss schedule
  // Parameters: message (string), variant ('info'|'success'|'warning'|'error'), duration (ms, optional, default 4000)
  addToast: (message, variant, duration = 4000) => set((state) => {
    const id = generateId('toast');
    const timeoutId = setTimeout(() => {
      useToastStore.getState().removeToast(id);
    }, duration);
    timeoutMap.set(id, timeoutId);
    return {
      toasts: [...state.toasts, { id, message, variant, duration }]
    };
  }),

  // ADDED: Remove a toast by id; cancel any pending auto-dismiss timer
  removeToast: (id) => set((state) => {
    const timeoutId = timeoutMap.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMap.delete(id);
    }
    return {
      toasts: state.toasts.filter(toast => toast.id !== id)
    };
  })
}));
