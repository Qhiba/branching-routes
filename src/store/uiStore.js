import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedNodeIds: [], // ADDED: track multi-selection
  snapToGrid: true,
  choiceDisplayMode: 'medium',
  labelDisplayMode: 'compact', // ADDED: Phase 2 display mode state
  // ADDED: Phase 3 — cluster visualization mode ('off' | 'chapter' | 'path' | 'both')
  clusterMode: 'off',

  // ADDED: Phase 1 — overlay toggle states for route tracing visualization
  showTraversalOverlay: true,
  // REMOVED (Phase 8): showRouteFinderDialog — RouteFinderDialog component deleted, replaced by RouteTracingPanel tab
  showShortestRouteOverlay: false,
  // ADDED: Phase 4 — selected route index for displaying specific path
  selectedRouteIndex: 0,

  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  toggleLabelDisplayMode: () => set(state => ({ labelDisplayMode: state.labelDisplayMode === 'compact' ? 'verbose' : 'compact' })), // ADDED: Phase 2 toggle
  // ADDED: Phase 3 — cycle cluster mode through off → chapter → path → both → off
  cycleClusterMode: () => set(state => {
    const next = { off: 'chapter', chapter: 'path', path: 'both', both: 'off' };
    return { clusterMode: next[state.clusterMode] };
  }),

  // ADDED: Phase 1 — overlay toggle actions
  toggleTraversalOverlay: () => set(state => ({ showTraversalOverlay: !state.showTraversalOverlay })),
  // REMOVED (Phase 8): toggleRouteFinderDialog — RouteFinderDialog deleted
  // MODIFIED: Phase 4 — reset selected route index when turning off overlay
  toggleShortestRouteOverlay: () => set(state => {
    const isNowOff = state.showShortestRouteOverlay;
    return {
      showShortestRouteOverlay: !state.showShortestRouteOverlay,
      selectedRouteIndex: isNowOff ? 0 : state.selectedRouteIndex
    };
  }),

  // ADDED: Phase 4 — set selected route index for display
  setSelectedRouteIndex: (n) => set({ selectedRouteIndex: n }),

  // ADDED: Freeze overlay — edge IDs that belong to the frozen prefix (rendered green on canvas)
  frozenWaypointEdgeIds: [],
  setFrozenWaypointEdgeIds: (ids) => set({ frozenWaypointEdgeIds: ids }),

  // Additional edge IDs to include in the route overlay for merged route groups
  mergedGroupEdgeIds: [],
  setMergedGroupEdgeIds: (ids) => set({ mergedGroupEdgeIds: ids }),

  setChoiceDisplayMode: (mode) => set({ choiceDisplayMode: mode }), // PROTECTED: Integrations unchanged
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }), // PROTECTED: Primary single-select semantics
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  
  // ADDED: multi-select setter with shallow compare to prevent infinite re-render loops from React Flow
  setSelectedNodeIds: (ids) => set(state => {
    if (state.selectedNodeIds.length === ids.length) {
      const currentSet = new Set(state.selectedNodeIds);
      if (ids.every(id => currentSet.has(id))) return state; // Order-independent comparison
    }
    return { selectedNodeIds: ids };
  }),
  
  // MODIFIED: clear selectedNodeIds on clearSelection
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null, selectedNodeIds: [] }),

  // PROTECTED: clearIfSelected and resetSelection interfaces
  clearIfSelected: (id, type) => {
    const state = get();
    if (type === 'node' && state.selectedNodeId === id) set({ selectedNodeId: null });
    if (type === 'edge' && state.selectedEdgeId === id) set({ selectedEdgeId: null });
  },

  resetSelection: () => set({ selectedNodeId: null, selectedEdgeId: null, selectedNodeIds: [] }) // MODIFIED: keep consistent with clearSelection
}));
