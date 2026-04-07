// ============================================================
// useSimulationSync.js — Wires simulation engine to store subscriptions
// ============================================================
// Manages the subscription lifecycle between stores and the
// simulation engine. Subscribes to narrative store + simulation
// store changes, debounces adaptively based on graph size, runs
// memoized recalculate(), and pushes results back into the
// simulation store.
//
// Phase 14: Uses memoizeSimulation() for cache-hit skipping and
// createDebouncedRecalculator() for graph-size-adaptive debounce.
//
// IMPORTANT: Only subscribes to INPUT fields of each store —
// never to outputs (evaluatedEdges, unreachableNodes) to avoid
// an infinite recalculation loop.
//
// Usage: call useSimulationSync() once in the app root (App.jsx).
//
// Dependencies:
//   - simulationEngine.recalculate()
//   - performanceOptimizer.memoizeSimulation()
//   - performanceOptimizer.createDebouncedRecalculator()
//   - useNarrativeStore
//   - useSimulationStore
//   - useCampaignStore
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useCampaignStore } from '@/store/useCampaignStore.js';
import { recalculate } from '@/engine/simulationEngine.js';
import {
  memoizeSimulation,
  createDebouncedRecalculator,
} from '@/engine/performanceOptimizer.js';

/**
 * Shallow compare two objects by reference equality of their values.
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

// Create memoized version of recalculate — singleton shared across renders
const memoizedRecalculate = memoizeSimulation(recalculate);

/**
 * Hook that wires the simulation engine to Zustand store subscriptions.
 *
 * On any relevant state change (narrative data, simulation overrides,
 * campaign state), it debounces (adaptively by graph size) and runs
 * `memoizedRecalculate()`, then pushes the results (evaluatedEdges,
 * unreachableNodes) into the simulation store.
 *
 * Phase 14: Upgraded with memoization and adaptive debounce for
 * 200+ node performance.
 *
 * Should be called exactly once, at the app root level.
 */
export function useSimulationSync() {
  const isMountedRef = useRef(true);

  // Memoized recalculation trigger
  const runRecalculation = useCallback(() => {
    // Read current state from all stores
    const narrativeState = useNarrativeStore.getState();
    const simState = useSimulationStore.getState();
    const campaignStore = useCampaignStore.getState();

    // Determine the active campaign state
    // If a campaign is active, use its overrides merged with the simulation store.
    // Otherwise, use simulation store overrides directly.
    const activeCampaign = campaignStore.getActiveCampaign();

    const campaignState = {
      nodeStates: simState.nodeStates,
      flagOverrides: {
        ...(activeCampaign?.flagOverrides ?? {}),
        ...simState.flagOverrides,
      },
      statusOverrides: {
        ...(activeCampaign?.statusOverrides ?? {}),
        ...simState.statusOverrides,
      },
    };

    // Build narrative data subset needed by the engine
    const narrativeData = {
      metadata: narrativeState.metadata,
      common: narrativeState.common,
      choice: narrativeState.choice,
      ending: narrativeState.ending,
      flag: narrativeState.flag,
      status: narrativeState.status,
    };

    // Run memoized simulation — cache hit returns instantly (Phase 14)
    const result = memoizedRecalculate(narrativeData, campaignState);

    // Push results into simulation store (only if still mounted)
    if (isMountedRef.current) {
      simState.setEvaluatedEdges(result.evaluatedEdges);
      simState.setUnreachableNodes(result.unreachableNodes);
      // AMBIGUOUS: autoLockSuggestions computed but not auto-applied.
      // These could be surfaced via UI in the status strip warnings.
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Run initial calculation immediately
    runRecalculation();

    // Phase 14: Adaptive debounce — shorter for small graphs, longer for large
    const getNodeCount = () => {
      const s = useNarrativeStore.getState();
      return (
        Object.keys(s.common).length +
        Object.keys(s.choice).length +
        Object.keys(s.ending).length
      );
    };

    const { schedule, cancel } = createDebouncedRecalculator(
      runRecalculation,
      getNodeCount
    );

    // Subscribe to narrative store changes (any entity collection change)
    const unsubNarrative = useNarrativeStore.subscribe(
      (state) => ({
        common: state.common,
        choice: state.choice,
        ending: state.ending,
        flag: state.flag,
        status: state.status,
        metadata: state.metadata,
      }),
      () => {
        schedule();
      },
      { equalityFn: shallowEqual }
    );

    // Subscribe to simulation store INPUT fields only.
    // DO NOT subscribe to evaluatedEdges or unreachableNodes — those are
    // outputs written by this hook. Subscribing to them would create an
    // infinite recalculation loop.
    const unsubSimulation = useSimulationStore.subscribe(
      (state) => ({
        nodeStates: state.nodeStates,
        flagOverrides: state.flagOverrides,
        statusOverrides: state.statusOverrides,
      }),
      () => {
        schedule();
      },
      { equalityFn: shallowEqual }
    );

    // Subscribe to campaign store changes (active campaign switch)
    const unsubCampaign = useCampaignStore.subscribe(
      (state) => ({
        activeCampaignId: state.activeCampaignId,
        campaigns: state.campaigns,
      }),
      () => {
        schedule();
      },
      { equalityFn: shallowEqual }
    );

    // Cleanup
    return () => {
      isMountedRef.current = false;
      cancel();
      unsubNarrative();
      unsubSimulation();
      unsubCampaign();
    };
  }, [runRecalculation]);
}
