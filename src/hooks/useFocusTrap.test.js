import { describe, it, expect } from 'vitest';
import useFocusTrap from './useFocusTrap.js';

describe('useFocusTrap hook (RISK-AUD-15)', () => {
  it('should export a default function', () => {
    expect(typeof useFocusTrap).toBe('function');
  });
});
