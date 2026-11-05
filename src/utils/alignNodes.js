// ADDED (Redesign Step 5): align / distribute for multi-selected nodes. Pure — the caller applies the result via
// narrativeStore.updateNode inside one undo group.

export const ALIGN_MODES = ['left', 'centerX', 'right', 'top', 'middleY', 'bottom', 'distributeX', 'distributeY'];

/**
 * @param {Array<{id: string, x: number, y: number, width: number, height: number}>} items  top-left + size
 * @param {string} mode one of ALIGN_MODES
 * @returns {Record<string, {x: number, y: number}>} new top-left positions for nodes that move
 */
export function computeAlignment(items, mode) {
  if (!Array.isArray(items) || items.length < 2) return {};
  const out = {};
  const set = (it, x, y) => {
    const nx = Math.round(x);
    const ny = Math.round(y);
    if (nx !== it.x || ny !== it.y) out[it.id] = { x: nx, y: ny };
  };

  const minX = Math.min(...items.map(i => i.x));
  const maxRight = Math.max(...items.map(i => i.x + i.width));
  const minY = Math.min(...items.map(i => i.y));
  const maxBottom = Math.max(...items.map(i => i.y + i.height));

  switch (mode) {
    case 'left': items.forEach(i => set(i, minX, i.y)); break;
    case 'right': items.forEach(i => set(i, maxRight - i.width, i.y)); break;
    case 'centerX': {
      const c = (minX + maxRight) / 2;
      items.forEach(i => set(i, c - i.width / 2, i.y));
      break;
    }
    case 'top': items.forEach(i => set(i, i.x, minY)); break;
    case 'bottom': items.forEach(i => set(i, i.x, maxBottom - i.height)); break;
    case 'middleY': {
      const c = (minY + maxBottom) / 2;
      items.forEach(i => set(i, i.x, c - i.height / 2));
      break;
    }
    case 'distributeX':
    case 'distributeY': {
      if (items.length < 3) return {};
      const horizontal = mode === 'distributeX';
      const pos = (i) => (horizontal ? i.x : i.y);
      const size = (i) => (horizontal ? i.width : i.height);
      const sorted = [...items].sort((a, b) => pos(a) - pos(b));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = pos(last) + size(last) - pos(first);
      const totalSize = sorted.reduce((s, i) => s + size(i), 0);
      const gap = (span - totalSize) / (sorted.length - 1);
      let cursor = pos(first);
      sorted.forEach(i => {
        if (horizontal) set(i, cursor, i.y); else set(i, i.x, cursor);
        cursor += size(i) + gap;
      });
      break;
    }
    default: return {};
  }
  return out;
}
