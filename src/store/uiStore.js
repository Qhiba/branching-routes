import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  snapToGrid: true,
  choiceDisplayMode: 'medium',

  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  setChoiceDisplayMode: (mode) => set({ choiceDisplayMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  clearIfSelected: (id, type) => {
    const state = get();
    if (type === 'node' && state.selectedNodeId === id) set({ selectedNodeId: null });
    if (type === 'edge' && state.selectedEdgeId === id) set({ selectedEdgeId: null });
  },

  resetSelection: () => set({ selectedNodeId: null, selectedEdgeId: null })
}));
