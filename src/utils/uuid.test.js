import { describe, it, expect, vi } from 'vitest';
import { generateId } from './uuid.js';

describe('uuid - generateId', () => {
  it('should generate a prefixed UUID string in standard secure context', () => {
    const id = generateId('opt');
    expect(id).toMatch(/^opt-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should fall back cleanly when crypto.randomUUID is undefined (non-secure file:// context)', () => {
    vi.stubGlobal('crypto', undefined);

    try {
      const fallbackId = generateId('node');
      expect(fallbackId).toMatch(/^node-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
