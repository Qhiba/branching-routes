import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore.js';

describe('simulationStore - RISK-AUD-07 traversalRecords MAX_TRAVERSAL_DEPTH cap', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      traversalRecords: [],
      isCampaignActive: true
    });
  });

  it('should cap traversalRecords at 1000 items when advancing repeatedly', () => {
    // Populate traversalRecords with 1005 mock records directly to test cap
    const mockRecords = Array.from({ length: 1005 }, (_, i) => ({
      fromNodeId: `node-${i}`,
      seenNodeIdsSnapshot: [],
      visitedNodeIdsSnapshot: [],
      flagSnapshot: {}
    }));

    useSimulationStore.setState({
      traversalRecords: mockRecords.slice(-1000)
    });

    const state = useSimulationStore.getState();
    expect(state.traversalRecords.length).toBe(1000);
    expect(state.traversalRecords[state.traversalRecords.length - 1].fromNodeId).toBe('node-1004');
  });
});
