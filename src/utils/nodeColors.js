// ADDED (Redesign Step 4): route ("node identity") colours for canvas-drawn elements that can't read CSS variables
// (the React Flow MiniMap paints SVG with JS-supplied colours). Values mirror --br-route-*-mark in system.css.
// ADDED (Redesign Step 8): edge stroke / arrowhead colour (mirrors --br-edge in system.css)
export const EDGE_COLOR = '#667086';

export const ROUTE_MARK_COLORS = {
    common: '#34b46a',
    choice: '#5b8cf0',
    ending: '#e2793a',
    hub: '#2cc9b6',
    warp: '#b07cf2',
};

/** MiniMap nodeColor callback: React Flow node → route colour. */
export function miniMapNodeColor(node) {
    switch (node.type) {
        case 'choiceNode': return ROUTE_MARK_COLORS.choice;
        case 'endingNode': return ROUTE_MARK_COLORS.ending;
        case 'hubNode': return ROUTE_MARK_COLORS.hub;
        case 'warpEntranceNode':
        case 'warpExitNode': return ROUTE_MARK_COLORS.warp;
        default: return ROUTE_MARK_COLORS.common;
    }
}

// ADDED (2026-11-06): canvas dot brightness. React Flow's <Background> takes a JS colour, so the Settings slider
// (uiStore.canvasDotLevel, 0-10) maps to a colour here: 0 = no dots, 1 = the original dim dots (#2a3040),
// 10 = very bright (#cdd5e8), evenly spaced in between. The default (3) is about the colour used before the slider existed.
export const CANVAS_DOT_LEVEL_MAX = 10;
export const CANVAS_DOT_LEVEL_DEFAULT = 3;
const DOT_DIM = [0x2a, 0x30, 0x40];
const DOT_BRIGHT = [0xcd, 0xd5, 0xe8];

/** Clamps any input to a valid integer level 0-10 (NaN falls back to the default). */
export function clampCanvasDotLevel(level) {
    const n = Math.round(Number(level));
    if (!Number.isFinite(n)) return CANVAS_DOT_LEVEL_DEFAULT;
    return Math.min(CANVAS_DOT_LEVEL_MAX, Math.max(0, n));
}

/** Dot colour for a level, or null for level 0 (dots hidden). */
export function canvasDotColor(level) {
    const l = clampCanvasDotLevel(level);
    if (l === 0) return null;
    const t = (l - 1) / (CANVAS_DOT_LEVEL_MAX - 1);
    const hex = DOT_DIM.map((from, c) => Math.round(from + (DOT_BRIGHT[c] - from) * t).toString(16).padStart(2, '0'));
    return '#' + hex.join('');
}
