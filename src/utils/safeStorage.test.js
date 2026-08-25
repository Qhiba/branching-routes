import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeGet, safeSet, safeRemove, safeClear } from './safeStorage';

describe('safeStorage', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    const dummyStorage = {
      getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: (key) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; }
    };

    vi.stubGlobal('window', { localStorage: dummyStorage });
  });

  it('reads and writes values safely in standard environments', () => {
    safeSet('test_key', 'hello');
    expect(safeGet('test_key')).toBe('hello');
  });

  it('returns fallback when key is not set', () => {
    expect(safeGet('non_existent', 'default')).toBe('default');
  });

  it('removes keys safely', () => {
    safeSet('test_key', 'value');
    safeRemove('test_key');
    expect(safeGet('test_key', null)).toBeNull();
  });

  it('clears storage safely', () => {
    safeSet('key1', 'val1');
    safeClear();
    expect(safeGet('key1', null)).toBeNull();
  });

  it('handles quota or security exceptions gracefully without throwing', () => {
    const errorStorage = {
      getItem: () => { throw new DOMException('SecurityError'); },
      setItem: () => { throw new DOMException('QuotaExceededError'); },
      removeItem: () => { throw new DOMException('SecurityError'); },
      clear: () => { throw new DOMException('SecurityError'); }
    };
    vi.stubGlobal('window', { localStorage: errorStorage });

    const success = safeSet('quota_test', 'value');
    expect(success).toBe(false);
    expect(safeGet('quota_test', 'fallback')).toBe('fallback');
  });
});
