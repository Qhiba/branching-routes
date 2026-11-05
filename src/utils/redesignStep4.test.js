// ADDED (Redesign Step 4): Enter-to-confirm rule, route colours
import { describe, it, expect } from 'vitest';
import { isConfirmEnter } from './dialogKeys.js';
import { miniMapNodeColor, ROUTE_MARK_COLORS } from './nodeColors.js';

const key = (k, tagName = 'INPUT', extra = {}) => ({
  key: k,
  shiftKey: false,
  altKey: false,
  isComposing: false,
  target: { tagName, isContentEditable: false, getAttribute: () => null },
  ...extra,
});

describe('isConfirmEnter', () => {
  it('confirms on plain Enter in a single-line input', () => {
    expect(isConfirmEnter(key('Enter'))).toBe(true);
  });
  it('ignores other keys, modified Enter and IME composition', () => {
    expect(isConfirmEnter(key('a'))).toBe(false);
    expect(isConfirmEnter(key('Enter', 'INPUT', { shiftKey: true }))).toBe(false);
    expect(isConfirmEnter(key('Enter', 'INPUT', { isComposing: true }))).toBe(false);
  });
  it('leaves Enter alone in textareas, selects, buttons and comboboxes', () => {
    expect(isConfirmEnter(key('Enter', 'TEXTAREA'))).toBe(false);
    expect(isConfirmEnter(key('Enter', 'SELECT'))).toBe(false);
    expect(isConfirmEnter(key('Enter', 'BUTTON'))).toBe(false);
    const combo = key('Enter');
    combo.target.getAttribute = (a) => (a === 'role' ? 'combobox' : null);
    expect(isConfirmEnter(combo)).toBe(false);
  });
});

describe('miniMapNodeColor', () => {
  it('maps React Flow node types to route colours', () => {
    expect(miniMapNodeColor({ type: 'commonNode' })).toBe(ROUTE_MARK_COLORS.common);
    expect(miniMapNodeColor({ type: 'choiceNode' })).toBe(ROUTE_MARK_COLORS.choice);
    expect(miniMapNodeColor({ type: 'endingNode' })).toBe(ROUTE_MARK_COLORS.ending);
    expect(miniMapNodeColor({ type: 'hubNode' })).toBe(ROUTE_MARK_COLORS.hub);
    expect(miniMapNodeColor({ type: 'warpExitNode' })).toBe(ROUTE_MARK_COLORS.warp);
  });
});
