// ============================================================
// useSimulationStore.js — Zustand store for simulation state
// ============================================================
// Manages per-node simulation state (status, seen), flag and
// status overrides from campaigns, and derived data (evaluated
// edges, unreachable nodes) that are computed by the simulation
// engine and pushed back in.
//
// State shape:
//   nodeStates         — { [nodeId]: { status, seen } }
//   flagOverrides      — { [flagId]: boolean }
//   statusOverrides    — { [statusId]: number }
//   evaluatedEdges     — { [edgeKey]: boolean }  (computed by engine)
//   unreachableNodes   — Set<nodeId>             (computed by engine)
//
// Architecture rules enforced:
//   AR-02: all simulation state lives here
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ── Status cycle ─────────────────────────────────────────────
// default → active → locked → complete → failed → branch_locked → default
const STATUS_CYCLE = [
  'default',
  'active',
  'locked',
  'complete',
  'failed',
  'branch_locked',
];

// ── Seen cycle ───────────────────────────────────────────────
// unseen → partially_seen → seen → unseen
const SEEN_CYCLE = ['unseen', 'partially_seen', 'seen'];

// ── Default node state ───────────────────────────────────────

function defaultNodeState() {
  return { status: 'default', seen: 'unseen' };
}

// ── Store ────────────────────────────────────────────────────

export const useSimulationStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State shape ─────────────────────────────────────────

    nodeStates: {},
    flagOverrides: {},
    statusOverrides: {},
    evaluatedEdges: {},
    unreachableNodes: new Set(),

    // ── Node status ─────────────────────────────────────────

    /**
     * Set the status of a node directly.
     * @param {string} nodeId
     * @param {string} status — one of STATUS_CYCLE values
     */
    setNodeStatus: (nodeId, status) => {
      set((state) => {
        const existing = state.nodeStates[nodeId] ?? defaultNodeState();
        return {
          nodeStates: {
            ...state.nodeStates,
            [nodeId]: { ...existing, status },
          },
        };
      });
    },

    /**
     * Cycle a node's status to the next value in the cycle.
     * default → active → locked → complete → failed → branch_locked → default
     * @param {string} nodeId
     */
    cycleNodeStatus: (nodeId) => {
      set((state) => {
        const existing = state.nodeStates[nodeId] ?? defaultNodeState();
        const currentIdx = STATUS_CYCLE.indexOf(existing.status);
        // If current status not found in cycle, wrap to default
        const nextIdx =
          currentIdx === -1 ? 0 : (currentIdx + 1) % STATUS_CYCLE.length;
        return {
          nodeStates: {
            ...state.nodeStates,
            [nodeId]: { ...existing, status: STATUS_CYCLE[nextIdx] },
          },
        };
      });
    },

    // ── Node seen ───────────────────────────────────────────

    /**
     * Set the seen state of a node directly.
     * @param {string} nodeId
     * @param {string} seen — one of SEEN_CYCLE values
     */
    setNodeSeen: (nodeId, seen) => {
      set((state) => {
        const existing = state.nodeStates[nodeId] ?? defaultNodeState();
        return {
          nodeStates: {
            ...state.nodeStates,
            [nodeId]: { ...existing, seen },
          },
        };
      });
    },

    /**
     * Cycle a node's seen state to the next value in the cycle.
     * unseen → partially_seen → seen → unseen
     * @param {string} nodeId
     */
    cycleNodeSeen: (nodeId) => {
      set((state) => {
        const existing = state.nodeStates[nodeId] ?? defaultNodeState();
        const currentIdx = SEEN_CYCLE.indexOf(existing.seen);
        const nextIdx =
          currentIdx === -1 ? 0 : (currentIdx + 1) % SEEN_CYCLE.length;
        return {
          nodeStates: {
            ...state.nodeStates,
            [nodeId]: { ...existing, seen: SEEN_CYCLE[nextIdx] },
          },
        };
      });
    },

    // ── Flag overrides ──────────────────────────────────────

    /**
     * Set a flag override value.
     * @param {string} flagId
     * @param {boolean} value
     */
    setFlagOverride: (flagId, value) => {
      set((state) => ({
        flagOverrides: { ...state.flagOverrides, [flagId]: value },
      }));
    },

    /**
     * Remove a flag override (revert to data model default).
     * @param {string} flagId
     */
    clearFlagOverride: (flagId) => {
      set((state) => {
        const { [flagId]: _removed, ...remaining } = state.flagOverrides;
        return { flagOverrides: remaining };
      });
    },

    // ── Status overrides ────────────────────────────────────

    /**
     * Set a status point override value.
     * @param {string} statusId
     * @param {number} value
     */
    setStatusOverride: (statusId, value) => {
      set((state) => ({
        statusOverrides: { ...state.statusOverrides, [statusId]: value },
      }));
    },

    /**
     * Remove a status override (revert to data model default).
     * @param {string} statusId
     */
    clearStatusOverride: (statusId) => {
      set((state) => {
        const { [statusId]: _removed, ...remaining } = state.statusOverrides;
        return { statusOverrides: remaining };
      });
    },

    // ── Derived state (set by simulation engine) ────────────

    /**
     * Replace the evaluated edges map (called by simulation engine).
     * @param {{ [edgeKey: string]: boolean }} edges
     */
    setEvaluatedEdges: (edges) => {
      set({ evaluatedEdges: edges });
    },

    /**
     * Replace the unreachable nodes set (called by simulation engine).
     * @param {Set<string>} nodes
     */
    setUnreachableNodes: (nodes) => {
      set({ unreachableNodes: nodes });
    },

    // ── Reset ───────────────────────────────────────────────

    /**
     * Reset all simulation state to defaults.
     * Clears node states, overrides, and derived data.
     */
    resetSimulation: () => {
      set({
        nodeStates: {},
        flagOverrides: {},
        statusOverrides: {},
        evaluatedEdges: {},
        unreachableNodes: new Set(),
      });
    },
  }))
);

// ── Export cycles for testing/reference ──────────────────────
export { STATUS_CYCLE, SEEN_CYCLE };
