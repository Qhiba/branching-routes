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

// ADDED (2026-11-06): canvas dot brightness levels (0 = hidden, 10 = very bright)
import { CANVAS_DOT_LEVEL_DEFAULT, CANVAS_DOT_LEVEL_MAX, canvasDotColor, clampCanvasDotLevel } from './nodeColors.js';

describe('canvas dot brightness', () => {
  it('level 0 hides the dots, level 1 is the original dim colour, level 10 is very bright', () => {
    expect(canvasDotColor(0)).toBeNull();
    expect(canvasDotColor(1)).toBe('#2a3040');
    expect(canvasDotColor(10)).toBe('#cdd5e8');
  });
  it('gets brighter with every level from 1 to 10', () => {
    const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    for (let i = 2; i <= CANVAS_DOT_LEVEL_MAX; i++) expect(lum(canvasDotColor(i))).toBeGreaterThan(lum(canvasDotColor(i - 1)));
  });
  it('clamps out-of-range and invalid values', () => {
    expect(clampCanvasDotLevel(-3)).toBe(0);
    expect(clampCanvasDotLevel(99)).toBe(10);
    expect(clampCanvasDotLevel('abc')).toBe(CANVAS_DOT_LEVEL_DEFAULT);
    expect(clampCanvasDotLevel('4')).toBe(4);
  });
});
