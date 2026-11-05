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
