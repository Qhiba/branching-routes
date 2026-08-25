/**
 * Safe localStorage wrapper utilities that catch DOMException / QuotaExceededError / SecurityError
 * in private browsing modes, restricted iframe sandboxes, or quota-constrained environments.
 */

const getStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch (err) {
    return null;
  }
  return null;
};

export const safeGet = (key, fallback = null) => {
  try {
    const storage = getStorage();
    if (!storage) return fallback;
    const item = storage.getItem(key);
    return item !== null ? item : fallback;
  } catch (err) {
    console.warn(`[safeStorage] Failed to read '${key}':`, err);
    return fallback;
  }
};

export const safeSet = (key, value) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, String(value));
    return true;
  } catch (err) {
    console.warn(`[safeStorage] Failed to write '${key}':`, err);
    return false;
  }
};

export const safeRemove = (key) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[safeStorage] Failed to remove '${key}':`, err);
    return false;
  }
};

export const safeClear = () => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.clear();
    return true;
  } catch (err) {
    console.warn(`[safeStorage] Failed to clear storage:`, err);
    return false;
  }
};
