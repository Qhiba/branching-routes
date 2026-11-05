// ADDED (Redesign Step 4): canvas navigation controls, replacing React Flow's default <Controls/>.
// Must render inside ReactFlowProvider (uses useReactFlow / useViewport — AR-19). Navigation only: it never
// mutates graph data, so it stays available during campaigns.
import React from 'react';
import { Minus, Plus, Maximize, Focus, Star, Crosshair, Map as MapIcon } from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useNarrativeStore, useUIStore } from 'store';
import './CanvasControls.css';

const NODE_HALF_W = 120;
const NODE_HALF_H = 80;

function findStartNode() {
    const s = useNarrativeStore.getState();
    return [...Object.values(s.common), ...Object.values(s.choice), ...Object.values(s.ending)]
        .find(n => n.data?.isStartNode) || null;
}

export default function CanvasControls() {
    const { zoomIn, zoomOut, zoomTo, fitView, setCenter } = useReactFlow();
    const { zoom } = useViewport();
    const showMiniMap = useUIStore(s => s.showMiniMap);
    const toggleMiniMap = useUIStore(s => s.toggleMiniMap);
    const selectionCount = useUIStore(s => (s.selectedNodeIds.length || (s.selectedNodeId ? 1 : 0)));
    const hasStart = useNarrativeStore(s =>
        Object.values(s.common).some(n => n.data?.isStartNode) ||
        Object.values(s.choice).some(n => n.data?.isStartNode) ||
        Object.values(s.ending).some(n => n.data?.isStartNode));

    const fitSelection = () => {
        const ui = useUIStore.getState();
        const ids = ui.selectedNodeIds.length ? ui.selectedNodeIds : (ui.selectedNodeId ? [ui.selectedNodeId] : []);
        if (ids.length) fitView({ nodes: ids.map(id => ({ id })), duration: 300, padding: 0.3, maxZoom: 1.5 });
    };

    const jumpToStart = () => {
        const start = findStartNode();
        if (start) setCenter(start.position.x + NODE_HALF_W, start.position.y + NODE_HALF_H, { zoom: Math.max(zoom, 1), duration: 300 });
    };

    return (
        <div className="br-canvas-controls" role="toolbar" aria-label="Canvas view">
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={() => zoomOut({ duration: 150 })} title="Zoom out" aria-label="Zoom out">
                <Minus />
            </button>
            <button
                className="br-btn br-btn--ghost br-btn--sm br-canvas-controls__zoom"
                onClick={() => zoomTo(1, { duration: 200 })}
                title="Reset zoom to 100%"
                aria-label={`Zoom ${Math.round(zoom * 100)}%. Reset to 100%`}
            >
                {Math.round(zoom * 100)}%
            </button>
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={() => zoomIn({ duration: 150 })} title="Zoom in" aria-label="Zoom in">
                <Plus />
            </button>
            <span className="br-canvas-controls__divider" aria-hidden="true" />
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={() => fitView({ duration: 300, padding: 0.15 })} title="Fit the whole story" aria-label="Fit the whole story">
                <Maximize />
            </button>
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={fitSelection} disabled={!selectionCount} title="Zoom to selection" aria-label="Zoom to selection">
                <Focus />
            </button>
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={jumpToStart} disabled={!hasStart} title="Go to the start node" aria-label="Go to the start node">
                <Star />
            </button>
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" onClick={() => setCenter(0, 0, { zoom: 1, duration: 300 })} title="Center on (0, 0)" aria-label="Center on origin">
                <Crosshair />
            </button>
            <span className="br-canvas-controls__divider" aria-hidden="true" />
            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-pressed={showMiniMap} onClick={toggleMiniMap} title={showMiniMap ? 'Hide minimap' : 'Show minimap'} aria-label="Minimap">
                <MapIcon />
            </button>
        </div>
    );
}

