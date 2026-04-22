import React, { useMemo } from 'react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';
// ADDED: Phase 3 — dead-end detection utility
import { detectDeadEnds } from 'utils';

// ADDED: Phase 2 — Coverage metrics and traversal overlay toggle component
export default function StatusStrip() {
  // ADDED: Phase 2 — per-slice selectors (AR-23, AR-14) — all hooks called unconditionally at top
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const seenCount = useSimulationStore(s => s.seenNodeIds.length);
  const traversedCount = useSimulationStore(s => s.traversedEdgeIds.length);
  const showTraversalOverlay = useUIStore(s => s.showTraversalOverlay);
  const toggleTraversalOverlay = useUIStore(s => s.toggleTraversalOverlay);
  const seenNodeIds = useSimulationStore(s => s.seenNodeIds);

  const common = useNarrativeStore(s => s.common);
  const choice = useNarrativeStore(s => s.choice);
  const ending = useNarrativeStore(s => s.ending);
  const edges = useNarrativeStore(s => s.edges);
  // ADDED: Phase 2 fix — activeNodeId selector for ending node detection
  const activeNodeId = useSimulationStore(s => s.activeNodeId);

  // ADDED: Phase 2 — derive coverage counts with useMemo (no inline computation per render)
  const totalNodeCount = useMemo(() =>
    Object.keys(common).length + Object.keys(choice).length + Object.keys(ending).length,
    [common, choice, ending]
  );

  const totalEndingCount = useMemo(() =>
    Object.keys(ending).length,
    [ending]
  );

  const totalEdgeCount = useMemo(() =>
    edges.length,
    [edges]
  );

  // ADDED: Phase 3 — detect dead-end nodes (nodes with no outgoing edges that are not endings)
  const deadEndCount = useMemo(() =>
    detectDeadEnds({ common, choice, ending, edges }).length,
    [common, choice, ending, edges]
  );

  const endingsReachedCount = useMemo(() => {
    // MODIFIED: Phase 2 fix — count ending nodes in seenNodeIds plus active node if it's an ending
    const seenEndings = seenNodeIds.filter(id => !!ending[id]).length;
    const activeIsEnding = isCampaignActive && !!ending[activeNodeId];
    return seenEndings + (activeIsEnding ? 1 : 0);
  }, [seenNodeIds, ending, isCampaignActive, activeNodeId]);

  // PROTECTED: Campaign-only visibility (conditional render after all hooks)
  if (!isCampaignActive) return null;

  // ADDED: Phase 2 — visitedCount includes current active node
  const visitedCount = seenCount + (isCampaignActive ? 1 : 0);

  return (
    <div className="status-strip">
      <div className="status-strip__readout">
        <span className="status-strip__label">Nodes:</span>
        <span className="status-strip__count">{visitedCount} / {totalNodeCount}</span>
      </div>
      <div className="status-strip__readout">
        <span className="status-strip__label">Endings:</span>
        <span className="status-strip__count">{endingsReachedCount} / {totalEndingCount}</span>
      </div>
      <div className="status-strip__readout">
        <span className="status-strip__label">Edges:</span>
        <span className="status-strip__count">{traversedCount} / {totalEdgeCount}</span>
      </div>
      {/* ADDED: Phase 3 — dead-end count readout */}
      <div className="status-strip__readout">
        <span className="status-strip__label">Dead-ends:</span>
        <span className="status-strip__count">{deadEndCount}</span>
      </div>
      <button onClick={toggleTraversalOverlay} className="status-strip__toggle">
        Overlay: {showTraversalOverlay ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
