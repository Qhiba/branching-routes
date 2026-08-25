import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore.js';

describe('uiStore - RISK-CMK-12 setSelectedNodeIds equality guard', () => {
  beforeEach(() => {
    useUIStore.getState().resetSelection();
  });

  it('should update selectedNodeIds when initial selection is set', () => {
    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-2']);
    expect(useUIStore.getState().selectedNodeIds).toEqual(['node-1', 'node-2']);
  });

  it('should return unchanged state reference when called with identical IDs in identical order', () => {
    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-2']);
    const stateBefore = useUIStore.getState();

    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-2']);
    const stateAfter = useUIStore.getState();

    expect(stateAfter).toBe(stateBefore); // Strict referential equality ensures no re-render loop
  });

  it('should return unchanged state reference when called with identical IDs in different order', () => {
    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-2']);
    const stateBefore = useUIStore.getState();

    useUIStore.getState().setSelectedNodeIds(['node-2', 'node-1']);
    const stateAfter = useUIStore.getState();

    expect(stateAfter).toBe(stateBefore); // Order-independent set comparison bails out
  });

  it('should update state reference when selection actually changes', () => {
    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-2']);
    const stateBefore = useUIStore.getState();

    useUIStore.getState().setSelectedNodeIds(['node-1', 'node-3']);
    const stateAfter = useUIStore.getState();

    expect(stateAfter).not.toBe(stateBefore);
    expect(stateAfter.selectedNodeIds).toEqual(['node-1', 'node-3']);
  });
});
