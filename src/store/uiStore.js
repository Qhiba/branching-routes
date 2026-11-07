import { create } from 'zustand';
import { safeGet, safeSet } from '../utils/safeStorage';
import { clampCanvasDotLevel } from '../utils/nodeColors';

export const useUIStore = create((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedNodeIds: [], // ADDED: track multi-selection
  snapToGrid: true,
  choiceDisplayMode: 'medium',
  labelDisplayMode: 'compact', // ADDED: Phase 2 display mode state
  canvasFilterChapterId: null, // ADDED: Step 3 canvas chapter filter
  canvasFilterPathId: null, // ADDED: Step 3 canvas path filter
  canvasFilterTagIds: [], // ADDED: canvas tag filters
  canvasFilterTagsLogic: 'or', // ADDED: tags filtering logic ('or' | 'and')
  canvasFilterNodeType: null, // ADDED (Redesign Step 6): 'common' | 'choice' | 'ending' | 'hub' | 'warp' | null
  canvasFilterCollectibleCategoryId: null, // ADDED (Redesign Step 6): collectible category ID | null

  // ADDED: Phase 1 — overlay toggle states for route tracing visualization
  showTraversalOverlay: true,
  // REMOVED (Phase 8): showRouteFinderDialog — RouteFinderDialog component deleted, replaced by RouteTracingPanel tab
  showShortestRouteOverlay: false,
  // ADDED: Phase 4 — selected route index for displaying specific path
  selectedRouteIndex: 0,

  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  toggleLabelDisplayMode: () => set(state => ({ labelDisplayMode: state.labelDisplayMode === 'compact' ? 'verbose' : 'compact' })), // ADDED: Phase 2 toggle
  // REMOVED (Step 3): cycleClusterMode - retired in favor of canvas filters

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
  setCanvasFilterChapterId: (id) => set({ canvasFilterChapterId: id }), // ADDED: Step 3
  setCanvasFilterPathId: (id) => set({ canvasFilterPathId: id }), // ADDED: Step 3
  setCanvasFilterTagIds: (ids) => set({ canvasFilterTagIds: ids }), // ADDED: tags filters
  setCanvasFilterTagsLogic: (logic) => set({ canvasFilterTagsLogic: logic }), // ADDED: tags filtering logic
  // ADDED (Redesign Step 6)
  setCanvasFilterNodeType: (type) => set({ canvasFilterNodeType: type || null }),
  setCanvasFilterCollectibleCategoryId: (id) => set({ canvasFilterCollectibleCategoryId: id || null }),
  resetCanvasFilters: () => set({
    canvasFilterChapterId: null,
    canvasFilterPathId: null,
    canvasFilterTagIds: [],
    canvasFilterTagsLogic: 'or',
    canvasFilterNodeType: null,
    canvasFilterCollectibleCategoryId: null,
  }),
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }), // PROTECTED: Primary single-select semantics
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  
  /**
   * PROTECTED / LOAD-BEARING (RISK-CMK-12):
   * Sets multi-selected node IDs with an order-independent set equality check.
   * If incoming `ids` match current `selectedNodeIds` (regardless of array order),
   * this returns unchanged `state` reference to prevent infinite React Flow
   * `onSelectionChange` re-render loops. DO NOT remove this equality check.
   */
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

  resetSelection: () => set({ selectedNodeId: null, selectedEdgeId: null, selectedNodeIds: [] }), // MODIFIED: keep consistent with clearSelection

  // Batch sequential flags configuration (Phase 8 Change #3) — RISK-AUD-11 safeStorage protection
  seqStart: Number(safeGet('br_seqStart', 1)),
  seqEnd: Number(safeGet('br_seqEnd', 3)),
  seqPad: Number(safeGet('br_seqPad', 3)),

  setSeqStart: (start) => {
    safeSet('br_seqStart', start);
    set({ seqStart: start });
  },
  setSeqEnd: (end) => {
    safeSet('br_seqEnd', end);
    set({ seqEnd: end });
  },
  setSeqPad: (pad) => {
    safeSet('br_seqPad', pad);
    set({ seqPad: pad });
  },

  // Copy/paste node configuration (Phase 8 Change #4)
  copiedNode: null,
  setCopiedNode: (node) => set({ copiedNode: node }),

  // Follow Active Node toggle (Phase 8 Change #6)
  followActiveNode: false,
  setFollowActiveNode: (val) => set({ followActiveNode: val }),

  // ADDED: Snap Assist — smart alignment guide snapping on node drop
  // snapAssist: session-only toggle (defaults to true on every load)
  // snapThreshold: persisted to localStorage via safeStorage (AR-33)
  snapAssist: true,
  snapThreshold: Number(safeGet('br_snapThreshold', 8)),

  // ADDED (2026-11-06): brightness of the canvas dots, 0 (hidden) .. 10 (very bright), persisted via safeStorage (AR-33)
  canvasDotLevel: clampCanvasDotLevel(safeGet('br_canvasDotBrightness', 3)),
  setCanvasDotLevel: (val) => {
    const level = clampCanvasDotLevel(val);
    safeSet('br_canvasDotBrightness', level);
    set({ canvasDotLevel: level });
  },

  // ADDED (Redesign Step 1): Feature switch — Campaign & Route Tracing (incl. Seen marks, Sandbox).
  // Default OFF. Persisted via safeStorage (AR-33). Hides UI only; stores and code stay intact.
  featureCampaign: safeGet('br_featureCampaign', 'false') === 'true',
  setFeatureCampaign: (val) => {
    safeSet('br_featureCampaign', !!val);
    set({ featureCampaign: !!val });
  },

  // ADDED (Redesign Step 1): Search setting — include edge conditions under their source node.
  // Default ON. Consumed by the unified search (Redesign Step 4).
  searchIncludeEdges: safeGet('br_searchIncludeEdges', 'true') === 'true',
  setSearchIncludeEdges: (val) => {
    safeSet('br_searchIncludeEdges', !!val);
    set({ searchIncludeEdges: !!val });
  },

  // ADDED (Redesign Step 4): minimap visibility (canvas controls toggle). Default ON, persisted (AR-33).
  showMiniMap: safeGet('br_showMiniMap', 'true') === 'true',
  toggleMiniMap: () => set(state => {
    safeSet('br_showMiniMap', !state.showMiniMap);
    return { showMiniMap: !state.showMiniMap };
  }),

  // ADDED (Redesign Step 5): keyboard shortcut sheet visibility ("?" or Settings → Keyboard shortcuts)
  showShortcuts: false,
  setShowShortcuts: (val) => set({ showShortcuts: !!val }),

  // ADDED (Redesign Step 1): Settings modal visibility (UI-only; opened from TopBar gear)
  showSettings: false,
  setShowSettings: (val) => set({ showSettings: !!val }),

  toggleSnapAssist: () => set(state => ({ snapAssist: !state.snapAssist })),
  setSnapThreshold: (val) => {
    safeSet('br_snapThreshold', Number(val));
    set({ snapThreshold: Number(val) });
  },
}));
