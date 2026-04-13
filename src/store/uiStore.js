import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // MOVED: selectedNodeId from graphStore
  selectedNodeId: null,
  // MOVED: selectedEdgeId from graphStore
  selectedEdgeId: null,
  // MOVED: snapToGrid from graphStore
  snapToGrid: true,

  // MOVED: toggleSnapToGrid from graphStore
  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  
  // MOVED: selectNode from graphStore
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  // MOVED: selectEdge from graphStore
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  // MOVED: clearSelection from graphStore
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  clearIfSelected: (id, type) => {
    const state = get();
    if (type === 'node' && state.selectedNodeId === id) set({ selectedNodeId: null });
    if (type === 'edge' && state.selectedEdgeId === id) set({ selectedEdgeId: null });
  },

  resetSelection: () => set({ selectedNodeId: null, selectedEdgeId: null })
}));
