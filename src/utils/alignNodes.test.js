// ADDED (Redesign Step 5)
import { describe, it, expect } from 'vitest';
import { computeAlignment } from './alignNodes.js';

const items = [
  { id: 'a', x: 0, y: 0, width: 100, height: 50 },
  { id: 'b', x: 300, y: 40, width: 200, height: 80 },
  { id: 'c', x: 120, y: 200, width: 100, height: 50 },
];

describe('computeAlignment', () => {
  it('aligns edges', () => {
    expect(computeAlignment(items, 'left')).toEqual({ b: { x: 0, y: 40 }, c: { x: 0, y: 200 } });
    expect(computeAlignment(items, 'right')).toEqual({ a: { x: 400, y: 0 }, c: { x: 400, y: 200 } });
    expect(computeAlignment(items, 'top')).toEqual({ b: { x: 300, y: 0 }, c: { x: 120, y: 0 } });
    expect(computeAlignment(items, 'bottom')).toEqual({ a: { x: 0, y: 200 }, b: { x: 300, y: 170 } });
  });

  it('aligns centres', () => {
    // bounds x 0..500 → centre 250
    expect(computeAlignment(items, 'centerX')).toEqual({ a: { x: 200, y: 0 }, b: { x: 150, y: 40 }, c: { x: 200, y: 200 } });
    // bounds y 0..250 → middle 125
    expect(computeAlignment(items, 'middleY').a).toEqual({ x: 0, y: 100 });
  });

  it('distributes with equal gaps, keeping the outer nodes in place', () => {
    const row = [
      { id: 'a', x: 0, y: 0, width: 100, height: 10 },
      { id: 'b', x: 150, y: 0, width: 100, height: 10 },
      { id: 'c', x: 500, y: 0, width: 100, height: 10 },
    ];
    // span 0..600, sizes 300 → gap 150 → b at 250
    expect(computeAlignment(row, 'distributeX')).toEqual({ b: { x: 250, y: 0 } });
  });

  it('needs at least two nodes (three to distribute)', () => {
    expect(computeAlignment(items.slice(0, 1), 'left')).toEqual({});
    expect(computeAlignment(items.slice(0, 2), 'distributeX')).toEqual({});
  });
});
